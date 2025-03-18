const express = require("express");
const crypto = require("crypto"); // For generating unique event IDs
const path = require("path");
const fs = require("fs-extra");
const archiver = require("archiver");
const rateLimit = require("express-rate-limit");
const VideoService = require("./lib/VideoService");
const cors = require("cors");

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(
  cors()
);

// ----------------------
// Global In-Memory Stores
// ----------------------
const events = new Map(); // for video generation events
const spamTracker = {}; // { ip: { count, firstRequestTime } }
const blockedIPs = new Set(); // IPs that are blocked for spam

// ----------------------
// Rate Limiter Middleware (development friendly)
// ----------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// ----------------------
// Spam Detection Middleware
// ----------------------
const SPAM_LIMIT = 600; // e.g. 600 requests per minute
const SPAM_WINDOW = 60 * 1000; // 1 minute
app.use((req, res, next) => {
  const ip = req.ip;
  if (blockedIPs.has(ip)) {
    return res
      .status(429)
      .send("Your IP has been blocked due to spammy behavior.");
  }
  const now = Date.now();
  if (!spamTracker[ip]) {
    spamTracker[ip] = { count: 1, firstRequestTime: now };
  } else {
    const tracker = spamTracker[ip];
    tracker.count++;
    // reset count if outside the window
    if (now - tracker.firstRequestTime > SPAM_WINDOW) {
      tracker.count = 1;
      tracker.firstRequestTime = now;
    }
    if (tracker.count > SPAM_LIMIT) {
      blockedIPs.add(ip);
      console.log(`Blocked IP ${ip} for spam.`);
      return res
        .status(429)
        .send("Too many requests. Your IP has been blocked.");
    }
  }
  next();
});

// ----------------------
// Middleware to parse body and update last access for /videos requests
// ----------------------
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// ----------------------
// Utility: Recursively list directory contents
// ----------------------
async function getDirectoryTree(dirPath, relativePath = "") {
  const stats = await fs.stat(dirPath);
  const info = {
    name: path.basename(dirPath),
    path: "/" + path.join(relativePath, path.basename(dirPath)),
    type: stats.isDirectory() ? "directory" : "file",
    size: stats.size,
    mtime: stats.mtime,
  };
  if (stats.isDirectory()) {
    info.children = [];
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const childPath = path.join(dirPath, file);
      const childRelative = path.join(relativePath, path.basename(dirPath));
      info.children.push(await getDirectoryTree(childPath, childRelative));
    }
  }
  return info;
}

// ----------------------
// Routes
// ----------------------

app.use((req, res, next) => {
    if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
        next();
    } else {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        res.sendFile(path.join(__dirname, 'public', "client", "dist"));
    }
});

// Serve the Client
app.use("/", express.static(path.join(__dirname, "public", "client", "dist")));

// POST /generate/video - Starts video generation and sets up event for SSE logs
app.post("/generate/video", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const eventId = crypto.randomUUID();
  const abortController = new AbortController();

  // Store the abortController with the event
  events.set(eventId, {
    logs: [],
    status: "progress",
    clients: new Set(),
    abortController,
  });

  res.status(202).json({ eventId, message: "Video generation started." });

  (async () => {
    try {
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        originalConsoleLog(...args);
        const logMessage = args.join(" ");
        const event = events.get(eventId);
        if (event) {
          event.logs.push(logMessage);
          event.clients.forEach((client) =>
            client.write(`data: ${JSON.stringify({ message: logMessage, status: "progress" })}\n\n`)
          );
        }
      };

      const videoService = new VideoService(prompt);
      // Pass the signal to generateVideo
      const videoData = await videoService.generateVideo(abortController.signal);

      console.log = originalConsoleLog;

      events.set(eventId, {
        ...events.get(eventId),
        status: "finished",
        videoData,
      });

      const event = events.get(eventId);
      event.clients.forEach((client) => {
        client.write(
          `data: ${JSON.stringify({
            videoData,
            status: "finished",
            message: "Video generation completed!",
          })}\n\n`
        );
        client.end();
      });
    } catch (error) {
      console.log = originalConsoleLog; // Restore console.log even on error
      const event = events.get(eventId);
      if (error.message === "Video generation aborted") {
        events.set(eventId, {
          ...event,
          status: "cancelled",
          error: "Video generation was cancelled.",
        });
        event.clients.forEach((client) => {
          client.write(
            `data: ${JSON.stringify({
              status: "cancelled",
              message: "Video generation was cancelled.",
            })}\n\n`
          );
          client.end();
        });
      } else {
        events.set(eventId, {
          ...event,
          status: "failed",
          error: error.message,
        });
        event.clients.forEach((client) => {
          client.write(`data: ${JSON.stringify({ error: error.message, status: "failed" })}\n\n`);
          client.end();
        });
      }
    }
  })();
});

// GET /events/:eventId - SSE endpoint to receive live logs about video generation
app.get("/events/:eventId", (req, res) => {
  const { eventId } = req.params;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const event = events.get(eventId);
  if (!event) {
    res.write(
      `data: ${JSON.stringify({
        error: "Event not found",
        status: "finished",
      })}\n\n`
    );
    res.end();
    return;
  }

  // Add this client (SSE connection) to the event's client set
  event.clients.add(res);

  res.write(`data: ${JSON.stringify({ status: "progress" })}\n\n`);

  // Send any logs that were already captured
  event.logs.forEach((log) => {
    res.write(
      `data: ${JSON.stringify({ message: log, status: "progress" })}\n\n`
    );
  });
  if (res.flush) res.flush();

  // Remove client from the event if the connection is closed
  req.on("close", () => {
    event.clients.delete(res);
    res.end();
  });
});

// POST /events/cancel/:eventId - Cancel a video generation
app.post("/generate/cancel/:eventId", (req, res) => {
  const { eventId } = req.params;
  const event = events.get(eventId);
  if (!event || !event.abortController) {
    return res.status(404).json({ error: "Event not found or already completed." });
  }
  event.abortController.abort();
  res.json({ message: "Video generation cancelled" });
});

// GET /videos/list - Returns a detailed JSON tree of the public/videos directory
app.get("/videos/list", async (req, res) => {
  try {
    const videosDir = path.join(__dirname, "public", "videos");
    const tree = await getDirectoryTree(videosDir);
    res.json(tree);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error reading videos directory", details: err.message });
  }
});

// GET /videos/zip/:video - Returns a zip archive of the specified video directory
app.get("/videos/zip/:video", async (req, res) => {
  const video = req.params.video;
  const videoDir = path.join(__dirname, "public", "videos", video);
  try {
    // Check if directory exists
    const exists = await fs.pathExists(videoDir);
    if (!exists) {
      return res.status(404).json({ error: "Video directory not found" });
    }

    // Set headers to indicate file download of a zip archive
    res.setHeader("Content-Disposition", `attachment; filename=${video}.zip`);
    res.setHeader("Content-Type", "application/zip");

    // Create archive and pipe to response
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      throw err;
    });
    archive.pipe(res);
    archive.directory(videoDir, false);
    archive.finalize();
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error creating zip archive", details: err.message });
  }
});

app.all("/*", (_, res) => {
    res.status(404).json({ error: "Not found" });	
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

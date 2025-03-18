const VideoGenerator = require("./VideoGenerator");
const generateVideoPrompt = require("./PromptService");
const { apiKey, models } = require("../config");
const Together = require("together-ai");

function sanitizeAndParseJson(jsonString) {
  // Try to parse the string directly as JSON.
  try {
    return JSON.parse(jsonString);
  } catch (initialError) {
    // If direct parsing fails, try to extract JSON from a markdown code block.
    // This regex matches triple backticks with an optional "json" specifier.
    const codeBlockRegex = /```(?:json\s*)?\n?([\s\S]*?)\n?```/i;
    const match = jsonString.match(codeBlockRegex);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (codeBlockError) {
        throw new Error(
          `Error parsing JSON from extracted code block: ${codeBlockError.message}`
        );
      }
    }
    // If no code block is found, throw the original error.
    throw new Error(`Invalid JSON input: ${initialError.message}`);
  }
}

class VideoService {
  constructor(prompt) {
    if (!prompt) return new Error("Prompt is required");
    this.prompt = prompt;
    this.together = new Together({ apiKey });
  }

  async generateVideo(signal) {
    try {
      if (signal.aborted) throw new Error("Video generation aborted");
      const video_prompt = generateVideoPrompt({
        prompt: this.prompt?.trim(),
      });
      const response = await this.together.chat.completions.create({
        messages: video_prompt,
        model: models.deepseek,
        temperature: 0.7,
        max_tokens: null,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
	signal,
      });
      const data = sanitizeAndParseJson(response.choices[0].message.content);
      const videoGenerator = new VideoGenerator(data);
      const videoData = await videoGenerator.generateVideo(signal);
      return videoData;
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
}

module.exports = VideoService;

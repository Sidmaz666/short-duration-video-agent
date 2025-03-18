/* eslint-disable @typescript-eslint/no-explicit-any */

type VideoGenerationResponse = {
  eventId: string;
  message: string;
};

type VideoData = {
  [x: string]: any;
  path: string;
  url: string;
  duration: number;
};

type EventMessage = {
  message?: string;
  videoData?: VideoData;
  error?: string;
  status?: string;
};

// Active event sources for cancellation
const activeEventSources = new Map<string, EventSource>();

export async function generateVideo(prompt: string): Promise<VideoGenerationResponse> {
  const response = await fetch("/generate/video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Error generating video: ${response.statusText}`);
  }

  return response.json();
}

export function cancelVideoGeneration(eventId: string): void {
  const eventSource = activeEventSources.get(eventId);
  if (eventSource) {
    eventSource.close();
    activeEventSources.delete(eventId);
  }
  
  // Call the cancel endpoint if the backend supports it
  // This is optional and depends on your backend implementation
  fetch(`/generate/cancel/${eventId}`, {
    method: "POST",
  }).catch(err => {
    console.warn("Error canceling video generation:", err);
  });
}

export function subscribeToEventLogs(
  eventId: string,
  onMessage: (message: EventMessage) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): () => void {
  const eventSource = new EventSource(`/events/${eventId}`);
  
  // Store the event source for potential cancellation
  activeEventSources.set(eventId, eventSource);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as EventMessage;
      
      // Check if the generation is complete
      if (data.videoData || data.status === "finished") {
        onComplete();
        eventSource.close();
        activeEventSources.delete(eventId);
      }
      
      onMessage(data);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  eventSource.onerror = (error) => {
    onError(new Error("Error connecting to event stream"));
    eventSource.close();
    activeEventSources.delete(eventId);
  };

  // Return a function to close the connection
  return () => {
    eventSource.close();
    activeEventSources.delete(eventId);
  };
}

export async function listVideoFiles(): Promise<any> {
  const response = await fetch("/videos/list");
  
  if (!response.ok) {
    throw new Error(`Error listing videos: ${response.statusText}`);
  }
  
  return response.json();
}

export async function setVideoEditMode(videoName: string, edit: boolean): Promise<any> {
  const response = await fetch(`/videos/${videoName}/edit-mode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ edit }),
  });
  
  if (!response.ok) {
    throw new Error(`Error setting edit mode: ${response.statusText}`);
  }
  
  return response.json();
}

export function getVideoZipUrl(videoName: string): string {
  return `/videos/zip/${videoName}`;
}

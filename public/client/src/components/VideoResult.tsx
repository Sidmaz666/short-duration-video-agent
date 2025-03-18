import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, DownloadCloud } from "lucide-react";

type VideoResultProps = {
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types, @typescript-eslint/no-explicit-any
  data: any;
  videoUrl?: string;
  fileName?: string;
};

export function VideoResult({ data, videoUrl, fileName }: VideoResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use the provided URL or fallback to a placeholder
  const displayUrl = videoUrl || "https://example.com/placeholder-video.mp4";
  const displayName = fileName || "generated-video.mp4";

  // Toggles video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggles mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handles volume changes
  const handleVolumeChange = (newVolume: number[]) => {
    const value = newVolume[0];
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      if (value === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // Updates the current time and duration as the video plays
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && duration !== videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  // Seeks the video to a new time
  const handleSeek = (newTime: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  // Formats seconds into "minutes:seconds" display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  // Show placeholder when no video is available
  if (!videoUrl) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center h-full p-8 text-center bg-muted/30 rounded-lg border">
        <div className="text-muted-foreground mb-4">
          Video will appear here after generation is complete
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={displayUrl}
          className="max-h-[80%] max-w-[80%] object-contain"
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={handleTimeUpdate}
          controls={false}
        />
      </div>
      <div className="p-4 bg-muted/20">
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
            <span className="text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <Button size="sm" variant="outline" className="ml-auto">
            <a href={displayUrl} download title={displayName} className="flex items-center">
              <DownloadCloud className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
          <div className="container mx-auto bg-background rounded-lg overflow-x-auto">
          <div className="p-6">
            {/* Topic and metadata */}
            <h2 className="text-2xl font-bold text-foreground mb-2">Topic: {data?.topic}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Niche: <span className="font-medium">{data?.niche}</span> | Seed:{" "}
              <span className="font-medium">{data?.random_seed}</span>
            </p>
    
            {/* Video title and hook */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-foreground">Title: {data?.video?.title}</h3>
              <p className="text-base text-muted-foreground">Hook: {data?.video?.hook}</p>
            </div>
    
            {/* Caption */}
            <div className="mb-4">
              <p className="text-base text-foreground">Caption: {data?.video?.caption}</p>
            </div>
    
            {/* Music type and hashtags */}
            <div className="mb-4">
              <p className="text-sm text-foreground">
                Music Type: <span className="font-medium">{data?.video?.music_type}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {data?.video?.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs font-medium text-primary px-2 py-1 rounded bg-primary/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
    
          </div>
        </div>
        </>
  );
}

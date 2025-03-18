import { useState, useRef, useEffect } from "react"
import type { FileNode } from "./types.ts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Maximize2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Video,
  ImageIcon,
  FileText,
  File,
  Music,
} from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useSidebar } from "../ui/sidebar.tsx"

interface FilePreviewProps {
  file: FileNode
}

  

export function FilePreview({ file }: FilePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const {open:isSidebarOpen} = useSidebar()

  // Determine the file extension
  const extension = file?.name?.split(".").pop()?.toLowerCase();

  useEffect(() => {
    // Reset states when the file changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setZoom(1);
    setRotation(0);
    setFileContent(null);

    if (!file || !extension) return;

    const url = file.path;

    const fetchResource = async () => {
      setIsLoading(true);
      try {
        // Fetch text-based files
        if (["txt", "md", "json", "srt"].includes(extension)) {
          const response = await fetch(url);
          const text = (await response.text()).trim();
          setFileContent(text);
        }
      } catch (error) {
        console.error("Failed to load file:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResource();
  }, [file, extension]);


// Helper function to wrap a string into lines of maxLineLength characters.
function wrapText(text, maxLineLength) {
    // Use regex to split text into chunks of maxLineLength characters.
    return text.match(new RegExp(`.{1,${maxLineLength}}`, 'g')).join('\n');
  }
  
  // Function that recursively processes the JSON object.
  function wrapJsonStrings(obj, maxLineLength = isSidebarOpen ? 40 : 50) {
    if (typeof obj === 'string') {
      // If the value is a string, wrap it.
      return wrapText(obj, maxLineLength);
    } else if (Array.isArray(obj)) {
      // Process each element in an array.
      return obj.map(item => wrapJsonStrings(item, maxLineLength));
    } else if (obj !== null && typeof obj === 'object') {
      // Process each key in an object.
      const newObj = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = wrapJsonStrings(obj[key], maxLineLength);
        }
      }
      return newObj;
    }
    // For other data types (number, boolean, etc.), return as is.
    return obj;
  }


  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)

    if (videoRef.current) {
      videoRef.current.volume = newVolume
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume
    }

    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    } else if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration)
    } else if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)

    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const formatFileSize = (size: number) => {
    if (size === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor(Math.log(size) / Math.log(k))
    return Number.parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "mp4":
      case "mov":
      case "webm":
        return "Video"
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "Image"
      case "mp3":
      case "wav":
      case "ogg":
        return "Audio"
      case "txt":
        return "Text"
      case "json":
        return "JSON"
      case "md":
        return "Markdown"
      case "srt":
        return "Subtitle"
      default:
        return "File"
    }
  }

  const renderPreview = () => {
    if (extension === "mp4" || extension === "mov" || extension === "webm") {
      // Video preview
      return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              className="max-h-[50%] max-w-[50%]"
              src={`${file.path}`} // In a real app, this would be the actual video URL
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={handleTimeUpdate}
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
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
                <span className="text-xs">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <Button variant="ghost" size="icon" title="Downlaod">
              <a href={`${file.path}`} download={file.name}>
              <Download className="h-4 w-4" />
              </a>
              </Button>
            </div>
          </div>
        </div>
      )
    } else if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "gif") {
      // Image preview
      return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <ScrollArea className="flex-1 flex items-center justify-center overflow-auto p-4">
            <div className="relative">
              <img
                ref={imageRef}
                src={`${file.path}`} // In a real app, this would be the actual video URL
                alt={file.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                }}
                className="max-w-full"
              />
            </div>
          </ScrollArea>
          <div className="p-4 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <span className="text-xs">{Math.round(zoom * 100)}%</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={`${file.path}`} download title={file.name}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )
    } else if (extension === "mp3" || extension === "wav" || extension === "ogg") {
      // Audio preview
      return (
        <div className="flex flex-col h-full relative">
             <div className="flex-1 flex items-center justify-center p-8 ">

            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h3 className="text-xl font-medium mb-2">{file.name}</h3>
                <p className="text-sm text-muted-foreground">Audio File • {formatTime(duration)}</p>
              </div>

              <audio
                ref={audioRef}
                src={`${file.path}`} // In a real app, this would be the actual audio URL
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={handleTimeUpdate}
                className="hidden"
              />

              {/* Audio visualization placeholder */}
              <div className="h-24 bg-muted/30 rounded-md mb-4 flex items-center justify-center">
                <p className="text-muted-foreground">Audio Visualization</p>
              </div>

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
                <span className="text-xs">{formatTime(currentTime)}</span>
                <span className="text-xs">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <Button variant="ghost" size="icon">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-full" />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4" asChild>
              <a href={`${file.path}`} download={file.name}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
        </div>
      )
    } else if (extension === "txt") {
      // Text preview
      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{file.name}</h3>
            <Button variant="ghost" size="sm" asChild>
              <a href="#" download={file.name}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm">{fileContent}</pre>
            )}
          </ScrollArea>
        </div>
      )
    } else if (extension === "json") {
      // JSON preview
      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{file.name}</h3>
            <Button variant="ghost" size="sm" asChild>
              <a href={`${file.path}`} download title={file.name}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <ScrollArea className="flex-1 max-h-[60vh] h-[60vh]">
            {isLoading ? (
              <div className="animate-pulse p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              </div>
            ) : (
              <SyntaxHighlighter 
              language="json" 
              style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 0, height: "100%" }}>
                {wrapJsonStrings(fileContent) || ""}
              </SyntaxHighlighter>
            )}
          </ScrollArea>
        </div>
      )
    } else if (extension === "md") {
      // Markdown preview
      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{file.name}</h3>
            <Button variant="ghost" size="sm" asChild>
              <a href="#" download={file.name}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
          <Tabs defaultValue="preview" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {/* In a real app, we would render the markdown content here */}
                  <h1>Markdown Sample</h1>
                  <h2>Introduction</h2>
                  <p>
                    This is a sample markdown file that demonstrates how markdown files are rendered in the file
                    browser.
                  </p>
                  <ul>
                    <li>List item 1</li>
                    <li>List item 2</li>
                    <li>List item 3</li>
                  </ul>
                  <pre>
                    <code className="language-js">const hello = 'world'; console.log(hello);</code>
                  </pre>
                </div>
              )}
            </TabsContent>
            <TabsContent value="source" className="flex-1 p-0 overflow-auto">
              {isLoading ? (
                <div className="animate-pulse p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                </div>
              ) : (
                <SyntaxHighlighter language="markdown" style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 0 }}>
                  {fileContent || ""}
                </SyntaxHighlighter>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )
    } else if (extension === "srt") {
      // SRT subtitle preview
      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{file.name}</h3>
            <Button variant="ghost" size="sm" asChild>
              <a href="#" download={file.name}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-1"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/4 mb-1"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {fileContent?.split("\n\n").map((block, index) => {
                  const lines = block.split("\n")
                  const number = lines[0]
                  const timing = lines[1]
                  const text = lines.slice(2).join("\n")

                  return (
                    <div key={index} className="border rounded p-2">
                      <div className="text-xs text-muted-foreground">{number}</div>
                      <div className="text-xs font-mono text-muted-foreground">{timing}</div>
                      <div className="mt-1">{text}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )
    } else {
      // Generic file preview
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">{getFileIcon(file.name)}</div>
            <h3 className="text-xl font-medium mb-2">{file.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {formatFileSize(file.size)} • {getFileType(file.name)} File
            </p>
            <Button asChild>
              <a href={`${file.path}`} download={file.name}>
                <Download className="h-4 w-4 mr-2" />
              </a>
            </Button>
          </div>
        </div>
      )
    }
  }

  return <div className="h-full">{renderPreview()}</div>
}

function getFileIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase()

  if (extension === "mp4" || extension === "mov" || extension === "webm") {
    return <Video className="h-12 w-12 text-blue-500" />
  } else if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "gif") {
    return <ImageIcon className="h-12 w-12 text-green-500" />
  } else if (extension === "txt" || extension === "md") {
    return <FileText className="h-12 w-12 text-yellow-500" />
  } else if (extension === "json") {
    return <FileText className="h-12 w-12 text-orange-500" />
  } else if (extension === "mp3" || extension === "wav" || extension === "ogg") {
    return <Music className="h-12 w-12 text-purple-500" />
  } else if (extension === "srt") {
    return <FileText className="h-12 w-12 text-pink-500" />
  } else {
    return <File className="h-12 w-12 text-gray-500" />
  }
}


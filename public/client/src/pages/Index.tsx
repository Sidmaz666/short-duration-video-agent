
import { useState, useEffect, MouseEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoResult } from "@/components/VideoResult";
import { LiveLogs } from "@/components/LiveLogs";
import { FileExplorer } from "@/components/file-explorer/file-explorer.tsx";
import { Textarea } from "@/components/ui/textarea";
import { generateVideo, subscribeToEventLogs, cancelVideoGeneration } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar, Prompt } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { 
  SidebarProvider,
  SidebarContent
} from "@/components/ui/sidebar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Film, 
  FileText, 
  FolderTree, 
  SendHorizonal, 
  Sparkles, 
  Loader2,
  XCircle
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from "@radix-ui/react-scroll-area";

type GenerationState = "idle" | "generating" | "complete" | "error";

const EXAMPLE_PROMPTS = [
  "Create a video about the best cosmic horror science fiction novel ever written",
  "A video on Top 5 Mideaval Castles you would choose if you were the king",
  "Create a video about the best places to visit in the world that is alien otherworldly",
  "Create a video where first quarter of the year would be shown monthly along with their fictional powers.",
  "One piece devil fruits based on your birth month."
];

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videoData, setVideoData] = useState<{url: string; name: string, data: any} | null>(null);
  const [activeTab, setActiveTab] = useState("input");
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const { toast } = useToast();
  const [promptHistory, setPromptHistory] = useState<Prompt[]>([]);
  const [selectedPromptDialog, setSelectedPromptDialog] = useState<Prompt | null>(null);

  useEffect(() => {
    const savedPrompts = localStorage.getItem('promptHistory');
    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts) as Prompt[];
        setPromptHistory(parsedPrompts);
      } catch (error) {
        console.error('Error parsing saved prompts:', error);
      }
    }
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    if (currentEventId && generationState === "generating") {
      cleanup = subscribeToEventLogs(
        currentEventId,
        (data) => {
          if (data.message) {
            setLogs((prev) => [...prev, data.message]);
          }
          
          if (data.videoData || data.status === "finished") {
            setVideoData({
              data: data.videoData.jsonData,
              url: `/videos/${data.videoData.finalVideoPath.split('/videos/')[1]}`,
              name: data.videoData.jsonData.video.title || 'video.mp4'
            });
            setGenerationState("complete");
            setActiveTab("video");
            toast({
              title: "Video Generated Successfully",
              description: "Your video is ready to view and download.",
            });
          }
          
          if (data.error) {
            setGenerationState("error");
            toast({
              title: "Error Generating Video",
              description: data.error,
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error("Event stream error:", error);
          setGenerationState("error");
          toast({
            title: "Connection Error",
            description: "Failed to connect to the generation stream.",
            variant: "destructive",
          });
        },
        () => {
          console.log("Event stream complete");
        }
      );
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [currentEventId, generationState, toast]);

  const handleGenerateVideo = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;
    
    if (!promptToUse.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "You need to provide a prompt to generate a video.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLogs([]);
      setVideoData(null);
      setGenerationState("generating");
      setActiveTab("logs");
      
      const response = await generateVideo(promptToUse);
      setCurrentEventId(response.eventId);
      
      const promptExists = promptHistory.some(p => p.text === promptToUse);
      if (!promptExists) {
        const newPrompt: Prompt = {
          id: uuidv4(),
          text: promptToUse,
          timestamp: Date.now()
        };
        
        const updatedHistory = [newPrompt, ...promptHistory];
        setPromptHistory(updatedHistory);
        localStorage.setItem('promptHistory', JSON.stringify(updatedHistory));
      }
      
      toast({
        title: "Video Generation Started",
        description: "Your video is now being generated.",
      });
    } catch (error) {
      console.error("Error starting video generation:", error);
      setGenerationState("error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start video generation",
        variant: "destructive",
      });
    }
  };

  const handleGenerateVideoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleGenerateVideo();
  };

  const handleCancelGeneration = () => {
    if (currentEventId) {
      cancelVideoGeneration(currentEventId);
      setGenerationState("idle");
      setCurrentEventId(null);
      toast({
        title: "Generation Cancelled",
        description: "Video generation has been cancelled.",
      });
    }
  };

  const handleExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  const handleSelectPrompt = (selectedPrompt: Prompt) => {
    setSelectedPromptDialog(selectedPrompt);
  };

  const handleConfirmPromptSelection = () => {
    if (selectedPromptDialog) {
      if (generationState !== "generating") {
        handleGenerateVideo(selectedPromptDialog.text);
        setSelectedPromptDialog(null);
      } else {
        toast({
          title: "Generation in Progress",
          description: "Please cancel the current generation before starting a new one.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewVideo = () => {
    if (generationState === "generating") {
      toast({
        title: "Generation in Progress",
        description: "Please cancel the current generation before starting a new one.",
        variant: "destructive",
      });
      return;
    }
    
    setPrompt("");
    setVideoData(null);
    setGenerationState("idle");
    setActiveTab("input");
  };

  const renderMainContent = () => {
    if (activeTab === "input" || generationState === "idle") {
      return (
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create Short Videos with AI</h1>
            <p className="text-muted-foreground">
              Generate professional-quality short videos ideal for social media, presentations, and more.
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 flex-1">
            <Textarea
              placeholder="Describe the video you want to create... Be specific about style, content, and mood."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 min-h-[200px] text-base"
              disabled={generationState === "generating"}
            />
            
            <Button 
              onClick={handleGenerateVideoClick}
              className="bg-sdva-purple hover:bg-sdva-purple/90 text-white"
              disabled={generationState === "generating" || !prompt.trim()}
            >
              {generationState === "generating" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
            
            {generationState === "generating" && (
              <Button 
                variant="outline" 
                onClick={handleCancelGeneration}
                className="mt-2"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Generation
              </Button>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Try an example prompt:</h3>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExamplePrompt(example)}
                    className="text-xs"
                    disabled={generationState === "generating"}
                  >
                    {example.length > 40 ? example.substring(0, 40) + "..." : example}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Tabs defaultValue="video" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
          <TabsTrigger value="logs" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center">
              <Film className="h-4 w-4 mr-2" />
              Result
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center">
              <FolderTree className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="video" className="flex-1 m-0">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              <VideoResult 
                data={videoData?.data}
                videoUrl={videoData?.url} 
                fileName={videoData?.name} 
              />
              
              {/* {generationState === "generating" && (
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelGeneration}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Video Generation
                  </Button>
                </div>
              )} */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="w-full flex flex-col">
          <Card className="h-full w-full">
            <CardContent className="p-6 h-full">
              <LiveLogs 
                logs={logs} 
                isComplete={generationState === "complete"} 
                onCancel={generationState === "generating" ? handleCancelGeneration : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files" className="flex-1 m-0">
        {/* {generationState === "generating" && (
                <div className="my-2 flex justify-end py-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelGeneration}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Video Generation
                  </Button>
                </div>
              )} */}
              <FileExplorer 
                videoName={videoData?.name?.split('.')[0]}
                onError={(error) => {
                  toast({
                    title: "Error Browsing Files",
                    description: error.message,
                    variant: "destructive",
                  });
                }}
              />
              


        </TabsContent>
      </Tabs>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen min-w-full flex relative overflow-hidden">
        {/* Decorative Glowing Blobs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl opacity-20 animate-pulse-gentle z-0"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl opacity-20 animate-pulse-gentle z-0" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl opacity-20 animate-pulse-gentle z-0" style={{ animationDelay: '1.5s' }}></div>
        
        <AppSidebar 
          onNewVideo={handleNewVideo} 
          onSelectPrompt={handleSelectPrompt} 
          isGenerating={generationState === "generating"}
        />
        <div className="h-full max-h-screen overflow-y-auto flex flex-col relative z-10 w-full">
          <Header />
          <main className="w-full py-6 px-4">
              {renderMainContent()}
          </main>
        </div>
      </div>

      <Dialog 
        open={selectedPromptDialog !== null} 
        onOpenChange={(open) => !open && setSelectedPromptDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Video with this Prompt?</DialogTitle>
            <DialogDescription>
              Do you want to generate a new video using the following prompt?
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 p-3 bg-muted rounded-md text-sm">
            {selectedPromptDialog?.text}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedPromptDialog(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPromptSelection}
              disabled={generationState === "generating"}
              className="bg-sdva-purple hover:bg-sdva-purple/90 text-white"
            >
              {generationState === "generating" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generation in Progress
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Index;

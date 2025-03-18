import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export type Prompt = {
  id: string;
  text: string;
  timestamp: number;
};

interface AppSidebarProps {
  onNewVideo?: () => void;
  onSelectPrompt?: (prompt: Prompt) => void;
  isGenerating?: boolean;
}

export function AppSidebar({
  onNewVideo,
  onSelectPrompt,
  isGenerating = false,
}: AppSidebarProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  // Load prompts from localStorage
  useEffect(() => {
    const savedPrompts = localStorage.getItem("promptHistory");
    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts) as Prompt[];
        setPrompts(parsedPrompts);
      } catch (error) {
        console.error("Error parsing saved prompts:", error);
        // If there's an error, initialize with empty array
        setPrompts([]);
      }
    }
  }, []);

  // Save prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("promptHistory", JSON.stringify(prompts));
  }, [prompts]);

  const handleNewChat = () => {
    setSelectedPrompt(null);
    if (onNewVideo) onNewVideo();
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt.id);
    if (onSelectPrompt) onSelectPrompt(prompt);
  };

  const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click

    // Update the local state
    const updatedPrompts = prompts.filter((prompt) => prompt.id !== id);
    setPrompts(updatedPrompts);

    // Update localStorage directly
    localStorage.setItem("promptHistory", JSON.stringify(updatedPrompts));

    toast({
      title: "Prompt deleted",
      description: "The prompt has been removed from your history.",
    });
  };

  const handleClearHistory = () => {
    setPrompts([]);
    setSelectedPrompt(null);

    // Clear from localStorage as well
    localStorage.setItem("promptHistory", JSON.stringify([]));

    toast({
      title: "History cleared",
      description: "All prompts have been removed from your history.",
    });
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Sidebar>
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl opacity-20 animate-pulse-gentle z-0"></div>
      <div
        className="absolute -bottom-40 left-1/4 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl opacity-20 animate-pulse-gentle z-0"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <SidebarHeader className="border-b px-4 py-2">
        <Button
          onClick={handleNewChat}
          className="w-full bg-sdva-purple hover:bg-sdva-purple/90 text-white"
          disabled={isGenerating}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Video
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <div className="space-y-1">
          <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span>Recent Prompts</span>
          </div>
          <div className="space-y-1">
            {prompts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground italic">
                No recent prompts
              </div>
            ) : (
              prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus-visible:ring-1",
                    "truncate flex flex-col relative group",
                    selectedPrompt === prompt.id
                      ? "bg-accent text-accent-foreground"
                      : "",
                    isGenerating ? "opacity-50 cursor-not-allowed" : ""
                  )}
                >
                  <button
                    onClick={() => !isGenerating && handleSelectPrompt(prompt)}
                    disabled={isGenerating}
                    className="text-left w-full pr-7"
                  >
                    <span className="truncate font-medium block">
                      {prompt.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(prompt.timestamp)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleDeletePrompt(prompt.id, e)}
                    className={cn(
                      "absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted",
                      isGenerating ? "pointer-events-none" : ""
                    )}
                    aria-label="Delete prompt"
                    disabled={isGenerating}
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="disabled:bg-none disabled:bg-transparent disable:text-muted-foreground"
              disabled={prompts.length === 0 || isGenerating}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear prompt history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your saved prompts. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory}>
                Yes, clear history
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}

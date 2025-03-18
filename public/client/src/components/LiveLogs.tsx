
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, XCircle } from "lucide-react";
import { useSidebar } from "./ui/sidebar";

type LiveLogsProps = {
  logs: string[];
  isComplete: boolean;
  onCancel?: () => void;
};

export function LiveLogs({ logs, isComplete, onCancel }: LiveLogsProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { open: isSidebarOpen } = useSidebar();
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium">Generation Logs</h3>
          {!isComplete && (
            <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 animate-pulse-gentle border-yellow-300">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
          {isComplete && (
            <Badge variant="outline" className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300">
              Complete
            </Badge>
          )}
        </div>
        
        {!isComplete && onCancel && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onCancel}
            className="flex items-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Generation
          </Button>
        )}
      </div>
      
      <ScrollArea className="border rounded-md p-4 bg-muted/30 h-[55vh] max-h-[55vh] container">
        <div ref={scrollAreaRef} className="font-mono text-sm space-y-2">
          {logs.length === 0 ? (
            <div className="text-muted-foreground italic">
              Waiting for logs...
            </div>
          ) : (
            <pre className={`whitespace-pre-wrap break-words overflow-auto ${
              isSidebarOpen ? 
               "lg:max-w-2xl md:max-w-md" :
               "lg:max-w-full md:max-w-4xl"
                }`}>
            {
            logs.map((log, index) => (
              <>
                {log + "\n"}
              </>
            ))
          }
             </pre>
          )}
          {!isComplete && (
            <div className="h-5 w-2 bg-sdva-purple inline-block ml-1 animate-pulse-gentle"></div>
          )}
          {
            isComplete && (
              <Check className="h-5 w-5 text-green-500 inline-block" />
            )
          }
        </div>
      </ScrollArea>
    </div>
  );
}


import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LayoutDashboard, ChevronLeft, ChevronRight, Github } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [systemPreference, setSystemPreference] = useState<boolean>(false);
  const {toggleSidebar, open:isSidebarOpen } = useSidebar();

  useEffect(() => {
    // Check for saved theme preference first
    const savedTheme = localStorage.getItem("theme");
    const savedUseSystem = localStorage.getItem("useSystemTheme") === "true";
    
    setSystemPreference(savedUseSystem);
    
    if (savedUseSystem) {
      applySystemTheme();
    } else if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system preference if no saved preference
      setSystemPreference(true);
      applySystemTheme();
    }

    // Add listener for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (systemPreference) {
        applySystemTheme();
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [systemPreference]);

  const applySystemTheme = () => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const newTheme = isDarkMode ? "dark" : "light";
    setTheme(newTheme);
    
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("useSystemTheme", "true");
  };

  const applyTheme = (selectedTheme: "light" | "dark") => {
    if (selectedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("useSystemTheme", "false");
  };

  const toggleTheme = () => {
    if (systemPreference) {
      // If using system, switch to manual light/dark
      setSystemPreference(false);
      const newTheme = theme === "light" ? "dark" : "light";
      setTheme(newTheme);
      applyTheme(newTheme);
    } else {
      // If already on manual, toggle between light/dark
      const newTheme = theme === "light" ? "dark" : "light";
      setTheme(newTheme);
      applyTheme(newTheme);
      
      // If we've cycled through both themes, go back to system
      if ((theme === "dark" && newTheme === "light")) {
        setSystemPreference(true);
        applySystemTheme();
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center mr-2">
            <Button
            onClick={toggleSidebar}
            variant="ghost" className="mr-2">
              {
                isSidebarOpen ? (
                  <ChevronLeft className="h-6 w-6" />
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )
              }
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          <span className="flex items-baseline font-bold text-xl">
            <span className="text-sdva-purple">SDVA</span>
            <span className="italic hidden md:inline ml-2 text-sm text-muted-foreground font-normal">
              Short Duration Video Agent
            </span>
          </span>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="transition-all"
            title={systemPreference ? "Using system theme" : `Theme: ${theme}`}
          >
            {systemPreference ? (
              window.matchMedia("(prefers-color-scheme: dark)").matches ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )
            ) : theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <a href="https://github.com/sidmaz666" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="transition-all">
            <Github className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}

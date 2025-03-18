import { useEffect, useState } from "react"
import { listVideoFiles } from "@/services/api";


import {
  Folder,
  File,
  FileText,
  ImageIcon,
  Video,
  Music,
  ChevronRight,
  ChevronDown,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Home,
  RefreshCw,
  Grid,
  List,
  Maximize2,
  Minimize2,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilePreview } from "./file-preview.tsx"
import { useIsMobile as useMobile } from "@/hooks/use-mobile.tsx"
import { set } from "date-fns";

type FileNode = {
  name: string
  path: string
  type: "directory" | "file"
  size: number
  mtime: string
  children?: FileNode[]
}

type FileExplorerProps = {
  videoName?: string
  onError?: (error: Error) => void
  initialPath?: string
}

// Sample data for default state
const defaultFileTree: FileNode = {
  name: "root",
  path: "/",
  type: "directory",
  size: 0,
  mtime: new Date().toISOString(),
  children: [
    {
      name: "Documents",
      path: "/Documents",
      type: "directory",
      size: 0,
      mtime: new Date().toISOString(),
      children: [
        {
          name: "project-notes.txt",
          path: "/Documents/project-notes.txt",
          type: "file",
          size: 1024,
          mtime: new Date().toISOString(),
        },
        {
          name: "meeting-minutes.md",
          path: "/Documents/meeting-minutes.md",
          type: "file",
          size: 2048,
          mtime: new Date().toISOString(),
        },
        {
          name: "config.json",
          path: "/Documents/config.json",
          type: "file",
          size: 512,
          mtime: new Date().toISOString(),
        },
      ],
    },
    {
      name: "Images",
      path: "/Images",
      type: "directory",
      size: 0,
      mtime: new Date().toISOString(),
      children: [
        {
          name: "vacation.jpg",
          path: "/Images/vacation.jpg",
          type: "file",
          size: 1024 * 1024,
          mtime: new Date().toISOString(),
        },
        {
          name: "profile.png",
          path: "/Images/profile.png",
          type: "file",
          size: 512 * 1024,
          mtime: new Date().toISOString(),
        },
      ],
    },
    {
      name: "Videos",
      path: "/Videos",
      type: "directory",
      size: 0,
      mtime: new Date().toISOString(),
      children: [
        {
          name: "tutorial.mp4",
          path: "/Videos/tutorial.mp4",
          type: "file",
          size: 10 * 1024 * 1024,
          mtime: new Date().toISOString(),
        },
        {
          name: "presentation.webm",
          path: "/Videos/presentation.webm",
          type: "file",
          size: 5 * 1024 * 1024,
          mtime: new Date().toISOString(),
        },
      ],
    },
    {
      name: "Audio",
      path: "/Audio",
      type: "directory",
      size: 0,
      mtime: new Date().toISOString(),
      children: [
        {
          name: "podcast.mp3",
          path: "/Audio/podcast.mp3",
          type: "file",
          size: 3 * 1024 * 1024,
          mtime: new Date().toISOString(),
        },
        {
          name: "interview.wav",
          path: "/Audio/interview.wav",
          type: "file",
          size: 8 * 1024 * 1024,
          mtime: new Date().toISOString(),
        },
      ],
    },
    {
      name: "Subtitles",
      path: "/Subtitles",
      type: "directory",
      size: 0,
      mtime: new Date().toISOString(),
      children: [
        {
          name: "movie.srt",
          path: "/Subtitles/movie.srt",
          type: "file",
          size: 15 * 1024,
          mtime: new Date().toISOString(),
        },
      ],
    },
    {
      name: "readme.txt",
      path: "/readme.txt",
      type: "file",
      size: 256,
      mtime: new Date().toISOString(),
    },
  ],
}

export function FileExplorer({ videoName, onError, initialPath = "/videos" }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState<string>(initialPath)
  const [navigationHistory, setNavigationHistory] = useState<string[]>([initialPath])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState<"name" | "size" | "type" | "date">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [previewOpen, setPreviewOpen] = useState(true)

  const isMobile = useMobile()

  useEffect(() => {
    async function fetchFileTree() {
      try {
        setLoading(true)

        // Try to fetch from API, but we expect this to fail
        try {
          const tree = await listVideoFiles()

          // Filter by videoName if provided
          if (videoName && tree.children) {
            const videoFolder = tree.children.find(
              (child: FileNode) => child.type === "directory" && child.name === videoName,
            )
            setFileTree(videoFolder || tree)
          } else {
            setFileTree(tree)
          }
        } catch (error) {
          console.log("Using default file tree:", error)
          setFileTree(defaultFileTree)
        }
      } catch (error) {
        console.error("Error in file tree handling:", error)
        if (onError && error instanceof Error) {
          onError(error)
        }
        // Fallback to default data
        setFileTree(defaultFileTree)
      } finally {
        setLoading(false)
      }
    }

    fetchFileTree()

    // Expand the initial path folders
    if (initialPath !== "/") {
      const pathParts = initialPath.split("/").filter(Boolean)
      let currentPathBuild = ""

      pathParts.forEach((part) => {
        currentPathBuild += "/" + part
        setExpandedFolders((prev) => new Set([...prev, currentPathBuild]))
      })
    }
  }, [videoName, onError, initialPath])

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const navigateTo = (path: string) => {
    setCurrentPath(path)
    setSelectedFile(null)

    // Add to history if it's a new navigation
    if (path !== navigationHistory[historyIndex]) {
      const newHistory = navigationHistory.slice(0, historyIndex + 1)
      newHistory.push(path)
      setNavigationHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }

  const navigateBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentPath(navigationHistory[historyIndex - 1])
      setSelectedFile(null)
    }
  }

  const navigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentPath(navigationHistory[historyIndex + 1])
      setSelectedFile(null)
    }
  }

  const refreshFiles = async () => {
    const tree = await listVideoFiles()

    // Filter by videoName if provided
    if (videoName && tree.children) {
      const videoFolder = tree.children.find(
        (child: FileNode) => child.type === "directory" && child.name === videoName,
      )
      setFileTree(videoFolder || tree)
    } else {
      setFileTree(tree)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === "mp4" || extension === "mov" || extension === "webm") {
      return <Video className="h-4 w-4 text-blue-500" />
    } else if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "gif") {
      return <ImageIcon className="h-4 w-4 text-green-500" />
    } else if (extension === "txt" || extension === "md") {
      return <FileText className="h-4 w-4 text-yellow-500" />
    } else if (extension === "json") {
      return <FileText className="h-4 w-4 text-orange-500" />
    } else if (extension === "mp3" || extension === "wav" || extension === "ogg") {
      return <Music className="h-4 w-4 text-purple-500" />
    } else if (extension === "srt") {
      return <FileText className="h-4 w-4 text-pink-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === "mp4" || extension === "mov" || extension === "webm") {
      return "Video"
    } else if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "gif") {
      return "Image"
    } else if (extension === "txt") {
      return "Text"
    } else if (extension === "md") {
      return "Markdown"
    } else if (extension === "json") {
      return "JSON"
    } else if (extension === "mp3" || extension === "wav" || extension === "ogg") {
      return "Audio"
    } else if (extension === "srt") {
      return "Subtitle"
    } else {
      return "File"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getCurrentFolderContents = (): FileNode[] => {
    if (!fileTree) return []

    // Compute the relative path within the current fileTree.
    let relativePath = currentPath
    if (fileTree.path !== "/" && currentPath.startsWith(fileTree.path)) {
      relativePath = currentPath.slice(fileTree.path.length) || "/"
    }

    if (relativePath === "/" || relativePath === "") {
      return fileTree.children || []
    }

    const pathParts = relativePath.split("/").filter(Boolean)
    let currentFolder: FileNode | undefined = fileTree

    for (const part of pathParts) {
      if (!currentFolder.children) return []
      currentFolder = currentFolder.children.find((child) => child.type === "directory" && child.name === part)
      if (!currentFolder) return []
    }

    return currentFolder.children || []
  }


  const sortedContents = () => {
    const contents = getCurrentFolderContents()

    return [...contents].sort((a, b) => {
      // Always sort directories first
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1
      }

      // Then sort by the selected criteria
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "size":
          comparison = a.size - b.size
          break
        case "type":
          if (a.type === "directory" && b.type === "directory") {
            comparison = a.name.localeCompare(b.name)
          } else if (a.type === "file" && b.type === "file") {
            const aExt = a.name.split(".").pop() || ""
            const bExt = b.name.split(".").pop() || ""
            comparison = aExt.localeCompare(bExt)
          }
          break
        case "date":
          comparison = new Date(a.mtime).getTime() - new Date(b.mtime).getTime()
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  const handleSort = (column: "name" | "size" | "type" | "date") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const handleFileClick = (file: FileNode) => {
    if (file.type === "directory") {
      navigateTo(file.path)
    } else {
      setSelectedFile(file)
    }
  }

  const getBreadcrumbItems = () => {
    const pathParts = currentPath.split("/").filter(Boolean)
    const items = [
      // <BreadcrumbItem key="root">
      //   <BreadcrumbLink onClick={() => navigateTo("/")}>
      //     <Home className="h-4 w-4" />
      //   </BreadcrumbLink>
      // </BreadcrumbItem>,
    ]

    let pathSoFar = ""

    pathParts.forEach((part, index) => {
      pathSoFar += "/" + part
      const path = pathSoFar

      items.push(<BreadcrumbSeparator key={`sep-${index}`} />)

      items.push(
        <BreadcrumbItem key={path}>
          <BreadcrumbLink onClick={() => navigateTo(path)}>{part}</BreadcrumbLink>
        </BreadcrumbItem>,
      )
    })

    return items
  }

  const renderGridView = () => {
    const contents = sortedContents()

    return (
      <div className={`grid grid-cols-2 ${previewOpen ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-4 lg:grid-cols-6"} gap-4 p-4`}>
        {contents.map((item) => (
          <div
            key={item.path}
            className={cn(
              "flex flex-col items-center p-3 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground",
              selectedFile?.path === item.path && "bg-accent text-accent-foreground",
            )}
            onClick={() => handleFileClick(item)}
          >
            <div className="w-16 h-16 flex items-center justify-center mb-2">
              {item.type === "directory" ? <Folder className="h-12 w-12 text-sdva-purple" /> : getFileIcon(item.name)}
            </div>
            <div className="text-center">
              <div className="text-sm font-medium truncate max-w-[100px]">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.type === "file" ? formatFileSize(item.size) : `${item.children?.length || 0} items`}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderListView = () => {
    const contents = sortedContents()

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] cursor-pointer" onClick={() => handleSort("name")}>
              Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
              Type {sortBy === "type" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("size")}>
              Size {sortBy === "size" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
              Date Modified {sortBy === "date" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contents.map((item) => (
            <TableRow
              key={item.path}
              className={cn("cursor-pointer", selectedFile?.path === item.path && "bg-accent text-accent-foreground")}
              onClick={() => handleFileClick(item)}
            >
              <TableCell title={item.name} className="flex items-center gap-2">
                {item.type === "directory" ? <Folder className="h-4 w-4 text-sdva-purple" /> : getFileIcon(item.name)}
                {item.name.length >= 20 ? item.name.slice(0,20) + "..."  : item.name}
              </TableCell>
              <TableCell>{item.type === "directory" ? "Folder" : getFileType(item.name)}</TableCell>
              <TableCell>
                {item.type === "file" ? formatFileSize(item.size) : `${item.children?.length || 0} items`}
              </TableCell>
              <TableCell>{formatDate(item.mtime)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const renderTreeView = (node: FileNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path)

    if (node.type === "directory") {
      return (
        <div key={node.path} className="file-tree-item">
          <div
            className={cn(
              "flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer",
              level > 0 && `ml-${level * 8}`,
              currentPath === node.path && "bg-accent text-accent-foreground",
            )}
            onClick={() => {
              toggleFolder(node.path)
              navigateTo(node.path)
            }}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
            <Folder className="h-4 w-4 mr-2 text-sdva-purple" />
            <span className="text-sm max-w-8">{node.name}</span>
          </div>

          {isExpanded && node.children && (
            <div className="ml-4">{node.children.map((child) => renderTreeView(child, level + 1))}</div>
          )}
        </div>
      )
    } else {
      return (
        <div
          key={node.path}
          className={cn(
            "flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded text-sm cursor-pointer",
            level > 0 && `ml-${level * 2}`,
            selectedFile?.path === node.path && "bg-accent text-accent-foreground",
          )}
          onClick={() => setSelectedFile(node)}
        >
          {getFileIcon(node.name)}
          <span className="ml-2 flex-1 truncate">{node.name}</span>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sdva-purple" />
      </div>
    )
  }

  if (!fileTree) {
    return <div className="text-center p-4 text-muted-foreground">No files available</div>
  }

  return (
    <div className="file-explorer border rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={navigateBack} disabled={historyIndex <= 0}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateForward}
                disabled={historyIndex >= navigationHistory.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => {
                setLoading(true)
                listVideoFiles().then(e => {
                  setFileTree(e)
                  setLoading(false)
                })
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Breadcrumb className="flex-1 px-2">
          <BreadcrumbList>{getBreadcrumbItems()}</BreadcrumbList>
        </Breadcrumb>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-accent" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List View</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-accent" : ""}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPath?.replace('/videos/','').replace("videos/",'') === "/videos"}
              >
                <a href={`/videos/zip/${currentPath?.replace('/videos/','').replace("videos/",'')}`}>
                <Download className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </TooltipProvider>
{/* 
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(!previewOpen)}>
                  {previewOpen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{previewOpen ? "Hide Preview" : "Show Preview"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )} */}
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-r hidden md:block">
          <ScrollArea className="h-[calc(100vh-12rem)] p-2">{renderTreeView(fileTree)}</ScrollArea>
        </div>

        {/* Main content */}
        <div className={cn("flex-1", !isMobile && previewOpen && selectedFile ? "md:w-1/2" : "md:w-full")}>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {viewMode === "list" ? renderListView() : renderGridView()}
          </ScrollArea>
        </div>

        {/* Preview pane */}
        {!isMobile && previewOpen && selectedFile && (
          <div className="w-full md:w-1/2 border-l">
            <FilePreview file={selectedFile} />
          </div>
        )}

        {/* Mobile preview (full screen) */}
        {isMobile && selectedFile && (
          <div className="fixed inset-0 bg-background z-50 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{selectedFile.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <FilePreview file={selectedFile} />
          </div>
        )}
      </div>
    </div>
  )
}


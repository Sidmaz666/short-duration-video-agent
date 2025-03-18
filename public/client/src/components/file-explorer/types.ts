export type FileNode = {
    name: string
    path: string
    type: "directory" | "file"
    size: number
    mtime: string
    children?: FileNode[] | null
  }
  
  
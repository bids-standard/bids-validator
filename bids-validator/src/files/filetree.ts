/**
 * Abstract FileTree for all environments (Deno, Browser, Python)
 */

// Avoid overloading the default File type
export interface BIDSFile {
  name: string
  size: Promise<number>
}

export class FileTree {
  // Reference to this FileTree location
  path: string
  // Name of this directory level
  name: string
  files: BIDSFile[]
  directories: FileTree[]
  parent?: FileTree

  constructor(path: string, name: string, parent?: FileTree) {
    this.path = path
    this.files = []
    this.directories = []
    this.name = path
    this.parent = parent
  }
}

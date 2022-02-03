/**
 * Abstract FileTree for all environments (Deno, Browser, Python)
 */

// Avoid overloading the default File type
export interface BIDSFile {
  name: string
  size: bigint
}

export interface Directory {
  name: string
  tree: FileTree
}

export class FileTree {
  // Reference to this FileTree location
  path: string
  files: [BIDSFile?]
  directories: [FileTree?]

  constructor(path: string) {
    this.path = path
    this.files = []
    this.directories = []
  }
}

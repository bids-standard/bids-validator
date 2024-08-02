/**
 * Abstract FileTree for all environments (Deno, Browser, Python)
 */
export interface BIDSFile {
  // Filename
  name: string
  // Dataset relative path for the file
  path: string
  // File size in bytes
  size: number
  // BIDS ignore status of the file
  ignored: boolean
  // ReadableStream to file raw contents
  stream: ReadableStream<Uint8Array>
  // Resolve stream to decoded utf-8 text
  text: () => Promise<string>
  // Read a range of bytes
  readBytes: (size: number, offset?: number) => Promise<Uint8Array>
  parent: FileTree
}

export class FileTree {
  // Relative path to this FileTree location
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
    this.name = name
    this.parent = parent
  }

  contains(parts: string[]): boolean {
    if (parts.length === 0) {
      return false
    } else if (parts.length === 1) {
      return (
        this.files.some((x) => x.name === parts[0]) ||
        this.directories.some((x) => x.name === parts[0])
      )
    } else if (parts.length > 1) {
      const nextDir = this.directories.find((x) => x.name === parts[0])
      if (nextDir) {
        return nextDir.contains(parts.slice(1, parts.length))
      } else {
        return false
      }
    } else {
      return false
    }
  }
}

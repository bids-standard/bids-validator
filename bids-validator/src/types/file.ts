/**
 * Abstract validation File for all environments (Deno, Browser, Python)
 */

// Avoid overloading the default File type
export interface BIDSFile {
  // Filename
  name: string
  // Dataset relative path for the file
  path: string
  // File size in bytes
  size: Promise<number>
  // BIDS ignore status of the file
  ignored: boolean
  // ReadableStream to file raw contents
  stream: Promise<ReadableStream<Uint8Array>>
}

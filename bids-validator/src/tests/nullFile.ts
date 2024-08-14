import { FileTree } from '../types/filetree.ts'
export const nullFile = {
  size: 0,
  ignored: false,
  parent: new FileTree('/', '/'),
  viewed: false,
  stream: new ReadableStream(),
  text: async () => '',
  readBytes: async (size: number, offset?: number) => new Uint8Array(),
}

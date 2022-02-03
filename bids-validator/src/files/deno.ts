/**
 * Deno specific implementation for reading files
 */
import { resolve, join, basename } from '../deps/path.ts'
import { FileTree } from './filetree.ts'

/**
 * Read in the target directory structure and return a FileTree
 */
export async function readFileTree(path: string): Promise<FileTree> {
  const absPath = resolve(Deno.cwd(), path)
  const base = basename(path)
  const tree = new FileTree(absPath, base)
  for await (const dirEntry of Deno.readDir(tree.path)) {
    if (dirEntry.isFile) {
      // TODO - Create a lazy stream reference
      tree.files.push({ name: dirEntry.name, size: BigInt(1) })
    }
    if (dirEntry.isDirectory) {
      const dirTree = await readFileTree(join(tree.path, dirEntry.name))
      tree.directories.push(dirTree)
    }
  }
  return tree
}

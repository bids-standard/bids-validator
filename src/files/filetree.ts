import { parse, SEPARATOR_PATTERN } from '@std/path'
import * as posix from '@std/path/posix'
import { type BIDSFile, FileTree } from '../types/filetree.ts'
import { FileIgnoreRules } from './ignore.ts'

const nullFile = {
  size: 0,
  stream: new ReadableStream({
    start(controller) {
      controller.close()
    },
  }),
  text: () => Promise.resolve(''),
  readBytes: async (size: number, offset?: number) => new Uint8Array(),
  parent: new FileTree('', '/'),
  viewed: false,
}

export function pathToFile(path: string, ignored: boolean = false): BIDSFile {
  const name = path.split('/').pop() as string
  return { name, path, ignored, ...nullFile }
}

export function pathsToTree(paths: string[], ignore?: string[]): FileTree {
  const ignoreRules = new FileIgnoreRules(ignore ?? [])
  return filesToTree(paths.map((path) => pathToFile(path, ignoreRules.test(path))))
}

export function filesToTree(fileList: BIDSFile[], ignore?: FileIgnoreRules): FileTree {
  ignore = ignore ?? new FileIgnoreRules([])
  const tree: FileTree = new FileTree('/', '/')
  for (const file of fileList) {
    const parts = parse(file.path)
    if (parts.dir === '/') {
      tree.files.push(file)
      file.parent = tree
      continue
    }
    let current = tree
    for (const level of parts.dir.split(SEPARATOR_PATTERN).slice(1)) {
      const exists = current.get(level) as FileTree
      if (exists) {
        current = exists
        continue
      }
      const newTree = new FileTree(posix.join(current.path, level), level, current, ignore)
      current.directories.push(newTree)
      current = newTree
    }
    current.files.push(file)
    file.parent = current
  }
  return tree
}

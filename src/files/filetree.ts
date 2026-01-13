import { parse, SEPARATOR_PATTERN } from '@std/path'
import * as posix from '@std/path/posix'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'

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

type RerootTreeOptions = {
  oldTree: FileTree
  newRoot: string
  ignore: FileIgnoreRules
  parent?: FileTree
}

function rerootTree({
  oldTree,
  newRoot,
  ignore,
  parent,
}: RerootTreeOptions): FileTree {
  const tree = new FileTree(
    oldTree.path.substr(newRoot.length) || '/',
    parent ? oldTree.name : `${oldTree.path}/`,  // Set the name of the root to its full path
    parent,
    ignore,
  )
  tree.files = oldTree.files.map((file) =>
    new BIDSFile(file.path.substr(newRoot.length), file.opener, ignore, tree)
  )
  tree.directories = oldTree.directories.map((dir) =>
    rerootTree({ oldTree: dir, newRoot, ignore, parent: tree })
  )
  return tree
}

export async function subtree(filetree: FileTree): Promise<FileTree> {
  const ignore = new FileIgnoreRules([])
  const tree = rerootTree({oldTree: filetree, newRoot: filetree.path, ignore})
  const bidsignore = tree.get('.bidsignore')
  if (bidsignore) {
    try {
      ignore.add(await readBidsIgnore(bidsignore as BIDSFile))
    } catch (err) {
      console.log(`Failed to read '.bidsignore' file with the following error:\n${err}`)
    }
  }
  return tree
}

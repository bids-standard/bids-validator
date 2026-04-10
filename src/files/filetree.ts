import { parse, SEPARATOR_PATTERN } from '@std/path'
import * as posix from '@std/path/posix'
import { BIDSFile, FileTree, type UnresolvedLink } from '../types/filetree.ts'
import { FileIgnoreRules, readBidsIgnore } from './ignore.ts'

/**
 * Walk a posix path and return the FileTree corresponding to its directory,
 * creating intermediate directory nodes as needed. Does not attach the final
 * segment; that's the caller's job.
 */
function descendTo(root: FileTree, dir: string, ignore: FileIgnoreRules): FileTree {
  if (dir === '/') return root
  let current = root
  for (const level of dir.split(SEPARATOR_PATTERN).slice(1)) {
    const exists = current.get(level) as FileTree
    if (exists) {
      current = exists
      continue
    }
    const newTree = new FileTree(posix.join(current.path, level), level, current, ignore)
    current.directories.push(newTree)
    current = newTree
  }
  return current
}

export function filesToTree(
  fileList: BIDSFile[],
  ignore?: FileIgnoreRules,
  unresolvedLinks: UnresolvedLink[] = [],
): FileTree {
  ignore = ignore ?? new FileIgnoreRules([])
  const tree: FileTree = new FileTree('/', '/')
  for (const file of fileList) {
    const parts = parse(file.path)
    const parent = descendTo(tree, parts.dir, ignore)
    parent.files.push(file)
    file.parent = parent
  }
  for (const link of unresolvedLinks) {
    const parts = parse(link.path)
    const parent = descendTo(tree, parts.dir, ignore)
    parent.links.push(link)
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
    parent ? oldTree.name : `${oldTree.path}/`, // Set the name of the root to its full path
    parent,
    ignore,
  )
  tree.files = oldTree.files.map((file) =>
    new BIDSFile(file.path.substr(newRoot.length), file.opener, ignore, tree)
  )
  tree.directories = oldTree.directories.map((dir) =>
    rerootTree({ oldTree: dir, newRoot, ignore, parent: tree })
  )
  tree.links = oldTree.links.map((link) => ({
    ...link,
    path: link.path.substr(newRoot.length),
  }))
  return tree
}

export function subtree(filetree: FileTree): Promise<FileTree> {
  const ignore = new FileIgnoreRules([])
  return loadBidsIgnore(rerootTree({ oldTree: filetree, newRoot: filetree.path, ignore }), ignore)
}

/**
 * Load .bidsignore file from the given tree and add the rules to the provided ignore object
 *
 * @param tree The file tree to search for a .bidsignore file
 * @param ignore The ignore object to add the rules to
 * @returns The original tree
 */
export async function loadBidsIgnore(tree: FileTree, ignore: FileIgnoreRules): Promise<FileTree> {
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

import { BIDSContext, type BIDSContextDataset } from './context.ts'
import { BIDSFile, type FileTree, type SymlinkReason } from '../types/filetree.ts'
import { NullFileOpener } from '../files/openers.ts'
import { loadTSV } from '../files/tsv.ts'
import { loadJSON } from '../files/json.ts'
import { readBytes, readText } from '../files/access.ts'
import type { bidsIssues } from '../issues/list.ts'
import { queuedAsyncIterator } from '../utils/queue.ts'

const REASON_TO_CODE: Record<SymlinkReason, keyof typeof bidsIssues> = {
  'broken': 'SYMLINK_BROKEN',
  'cycle': 'SYMLINK_CYCLE',
  'out-of-tree': 'SYMLINK_OUT_OF_TREE',
  'submodule': 'SYMLINK_IN_SUBMODULE',
  'directory-unsupported': 'SYMLINK_DIRECTORY_UNSUPPORTED',
}

function* quickWalk(dir: FileTree): Generator<BIDSFile> {
  for (const file of dir.files) {
    yield file
  }
  for (const subdir of dir.directories) {
    yield* quickWalk(subdir)
  }
}

function pseudoFile(dir: FileTree, opaque: boolean): BIDSFile {
  return new BIDSFile(
    // Use a trailing slash to indicate directory
    `${dir.path}/`,
    new NullFileOpener(opaque ? [...quickWalk(dir)].reduce((acc, file) => acc + file.size, 0) : 0),
    dir.ignored,
    dir.parent as FileTree,
  )
}

type CleanupFunction = () => void

/** Recursive algorithm for visiting each file in the dataset, creating a context */
async function* _walkFileTree(
  fileTree: FileTree,
  dsContext: BIDSContextDataset,
): AsyncIterable<BIDSContext | CleanupFunction> {
  for (const link of fileTree.links) {
    if (fileTree.isPathIgnored(link.path)) continue
    dsContext.issues.add({
      code: REASON_TO_CODE[link.reason],
      location: link.path,
    })
  }
  for (const file of fileTree.files) {
    if (file.ignored) {
      continue
    }
    yield new BIDSContext(file, dsContext)
  }
  for (const dir of fileTree.directories) {
    if (dir.ignored) {
      continue
    }
    const pseudo = dsContext.isPseudoFile(dir)
    const opaque = pseudo || dsContext.isOpaqueDirectory(dir)
    const context = new BIDSContext(pseudoFile(dir, opaque), dsContext)
    context.directory = !pseudo
    yield context
    if (!opaque) {
      yield* _walkFileTree(dir, dsContext)
    }
  }
  yield () => {
    loadTSV.cache.delete(fileTree.path)
    loadJSON.cache.delete(fileTree.path)
    readBytes.cache.delete(fileTree.path)
    readText.cache.delete(fileTree.path)
  }
}

/** Walk all files in the dataset and construct a context for each one */
export async function* walkFileTree(
  dsContext: BIDSContextDataset,
  bufferSize: number = 1,
): AsyncIterable<BIDSContext> {
  for await (
    const context of queuedAsyncIterator(_walkFileTree(dsContext.tree, dsContext), bufferSize)
  ) {
    await context.loaded
    yield context
  }
}

import { BIDSContext, type BIDSContextDataset } from './context.ts'
import { BIDSFile, type FileTree } from '../types/filetree.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { NullFileOpener } from '../files/openers.ts'
import { loadTSV } from '../files/tsv.ts'
import { loadJSON } from '../files/json.ts'
import { queuedAsyncIterator } from '../utils/queue.ts'

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
  }
}

/** Walk all files in the dataset and construct a context for each one */
export async function* walkFileTree(
  dsContext: BIDSContextDataset,
  bufferSize: number = 1,
): AsyncIterable<BIDSContext> {
  for await (const context of queuedAsyncIterator(_walkFileTree(dsContext.tree, dsContext), bufferSize)) {
    await context.loaded
    yield context
  }
}

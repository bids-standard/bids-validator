import { BIDSContext, type BIDSContextDataset } from './context.ts'
import { BIDSFile, FileOpener, FileTree } from '../types/filetree.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { loadTSV } from '../files/tsv.ts'
import { loadJSON } from '../files/json.ts'

function* quickWalk(dir: FileTree): Generator<BIDSFile> {
  for (const file of dir.files) {
    yield file
  }
  for (const subdir of dir.directories) {
    yield* quickWalk(subdir)
  }
}

class NullFileOpener implements FileOpener {
  size: number
  constructor(size = 0) {
    this.size = size
  }
  stream = async () =>
    new ReadableStream({
      start(controller) {
        controller.close()
      },
    })
  text = async () => ''
  readBytes = async (size: number, offset?: number) => new Uint8Array()
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

/** Recursive algorithm for visiting each file in the dataset, creating a context */
async function* _walkFileTree(
  fileTree: FileTree,
  dsContext: BIDSContextDataset,
): AsyncIterable<BIDSContext> {
  for (const file of fileTree.files) {
    yield new BIDSContext(file, dsContext)
  }
  for (const dir of fileTree.directories) {
    const pseudo = dsContext.isPseudoFile(dir)
    const opaque = pseudo || dsContext.isOpaqueDirectory(dir)
    const context = new BIDSContext(pseudoFile(dir, opaque), dsContext)
    context.directory = !pseudo
    yield context
    if (!opaque) {
      yield* _walkFileTree(dir, dsContext)
    }
  }
  loadTSV.cache.delete(fileTree.path)
  loadJSON.cache.delete(fileTree.path)
}

/** Walk all files in the dataset and construct a context for each one */
export async function* walkFileTree(
  dsContext: BIDSContextDataset,
): AsyncIterable<BIDSContext> {
  yield* _walkFileTree(dsContext.tree, dsContext)
}

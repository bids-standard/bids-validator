import { BIDSContext, BIDSContextDataset } from './context.ts'
import { FileTree } from '../types/filetree.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { loadTSV } from '../files/tsv.ts'

/** Recursive algorithm for visiting each file in the dataset, creating a context */
export async function* _walkFileTree(
  fileTree: FileTree,
  dsContext: BIDSContextDataset,
): AsyncIterable<BIDSContext> {
  for (const file of fileTree.files) {
    yield new BIDSContext(file, dsContext)
  }
  for (const dir of fileTree.directories) {
    yield* _walkFileTree(dir, dsContext)
  }
  loadTSV.cache.delete(fileTree.path)
}

/** Walk all files in the dataset and construct a context for each one */
export async function* walkFileTree(
  dsContext: BIDSContextDataset,
): AsyncIterable<BIDSContext> {
  yield* _walkFileTree(dsContext.tree, dsContext)
}

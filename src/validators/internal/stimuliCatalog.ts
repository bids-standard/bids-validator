import type { FileTree } from '../../types/filetree.ts'

/**
 * A stimuli.tsv catalog anywhere under /stimuli indicates the BEP044
 * stimulus organization ("catalog mode"). Legacy datasets have none, and
 * their free-form /stimuli content is exempt from the stimulus naming and
 * usage rules. Subdirectory catalogs count: a self-describing stimulus
 * pack may carry its own stimuli.tsv without a dataset-wide root catalog.
 */
export function hasStimuliCatalog(tree: FileTree | undefined): boolean {
  if (!tree) {
    return false
  }
  if (tree.files.some((f) => f.name === 'stimuli.tsv')) {
    return true
  }
  return tree.directories.some((dir) => hasStimuliCatalog(dir))
}

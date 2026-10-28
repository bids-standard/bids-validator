import type { FileTree } from '../../types/filetree.ts'

/**
 * A stimuli.tsv catalog at the root of /stimuli indicates the BEP044
 * stimulus organization ("catalog mode"). Legacy datasets have none, and
 * their free-form /stimuli content is exempt from the stimulus naming and
 * usage rules.
 */
export function hasStimuliCatalog(tree: FileTree | undefined): boolean {
  return tree?.files.some((f) => f.name === 'stimuli.tsv') ?? false
}

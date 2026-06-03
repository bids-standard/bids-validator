import type { BIDSFile } from '../types/filetree.ts'
import { default as ignore } from '@ignore'
import type { Ignore } from '@ignore'

/**
 * Read a `.bidsignore` file and return its lines as ignore patterns.
 *
 * @param file - The `.bidsignore` file to read.
 * @returns An array of gitignore-style patterns.
 */
export async function readBidsIgnore(file: BIDSFile): Promise<string[]> {
  const value = await file.text()
  if (value) {
    const lines = value.split('\n')
    return lines
  } else {
    return []
  }
}

/** Names of rules for either pruning or ignoring files. */
export type IgnoreGroup = 'ignore' | 'prune'

const ignoreDefaults: Record<IgnoreGroup, string[]> = {
  'ignore': [
    '/sourcedata/',
    '/derivatives/',
    '/code/',
    '/stimuli/',
    '/log/',
    '/doc/',
  ],
  'prune': [
    '.**',
  ],
}

/**
 * Gitignore-style path matcher for `.bidsignore` rules.
 *
 * @param config - Array of gitignore-style patterns.
 * @param addDefaults - When set, pre-populate with default ignore groups.
 *   "ignore" (the default) ignores opaque BIDS directories at the top level,
 *   while "prune" ignores dotfiles at all levels.
 *   Set to `false` to disable default rules.
 */
export class FileIgnoreRules {
  #ignore: Ignore

  constructor(
    config: string[],
    addDefaults: IgnoreGroup | false = 'ignore',
  ) {
    this.#ignore = ignore()
    if (addDefaults) {
      this.#ignore.add(ignoreDefaults[group])
    }
    this.#ignore.add(config)
  }

  /**
   * Extend the rule set with additional gitignore-style patterns.
   *
   * @param config - Array of patterns to add (same format as `.bidsignore`).
   */
  add(config: string[]): void {
    this.#ignore.add(config)
  }

  /**
   * Test whether a dataset-relative path should be ignored.
   *
   * @param path - Dataset-relative path with a leading `/` (the leading slash
   *   is stripped internally before matching).
   * @returns `true` if the path is matched by any active ignore pattern.
   */
  test(path: string): boolean {
    // Paths come in with a leading slash, but ignore expects paths relative to root
    return this.#ignore.ignores(path.slice(1, path.length))
  }
}

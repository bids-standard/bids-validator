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

const defaultIgnores = [
  '.git**',
  '.*',
  'sourcedata/',
  'code/',
  'stimuli/',
  'log/',
]

/**
 * Gitignore-style path matcher for `.bidsignore` rules.
 *
 * @param config - Array of gitignore-style patterns.
 * @param addDefaults - When `true` (the default), standard BIDS ignores
 *   (`.git**`, `sourcedata/`, `code/`, etc.) are prepended.
 */
export class FileIgnoreRules {
  #ignore: Ignore

  constructor(
    config: string[],
    addDefaults: boolean = true,
  ) {
    this.#ignore = ignore()
    if (addDefaults) {
      this.#ignore.add(defaultIgnores)
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

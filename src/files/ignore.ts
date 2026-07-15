import { default as ignore, type Ignore } from '@ignore'
import type { BIDSFile } from '../types/filetree.ts'
import { logger } from '../utils/logger.ts'

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

/** Options for logging ignored files. */
export type LogOptions = {
  log?: boolean
  prefix?: string
}

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
    '!/.bidsignore',
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
      this.addDefaults(addDefaults)
    }
    this.#ignore.add(config)
  }

  /**
   * Add default ignore group to the ignore rules.
   *
   * @param group - Group to add to the ignore rules.
   *   "ignore" ignores opaque BIDS directories at the top level,
   *   while "prune" ignores dotfiles at all levels.
   */
  addDefaults(group: IgnoreGroup): void {
    this.#ignore.add(ignoreDefaults[group])
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
   * @param options - Logging options. If `log` is set, a message is logged.
   *   `prefix` is prepended to the log message (default: "Ignoring path").
   * @returns `true` if the path is matched by any active ignore pattern.
   */
  test(path: string, options?: LogOptions): boolean {
    // Paths come in with a leading slash, but ignore expects paths relative to root
    const ignored = this.#ignore.ignores(path.slice(1, path.length))
    if (ignored && options?.log) {
      logger.info(`${options.prefix ?? 'Ignoring path'}: ${path}`)
    }
    return ignored
  }
}

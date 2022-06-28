import { ignore, Ignore } from '../deps/ignore.ts'
import { FileIgnoreRules } from '../types/ignore.ts'

/**
 * Deno implementation of .bidsignore style rules
 */
export class FileIgnoreRulesDeno implements FileIgnoreRules {
  #ignore: Ignore

  constructor(config: string[]) {
    this.#ignore = ignore({ allowRelativePaths: true })
    this.#ignore.add(config)
  }

  /** Test if a dataset relative path should be ignored given configured rules */
  test(path: string): boolean {
    return !this.#ignore.ignores(path)
  }
}

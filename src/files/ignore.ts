import type { BIDSFile } from '../types/filetree.ts'
import { default as ignore } from '@ignore'
import type { Ignore } from '@ignore'

export async function readBidsIgnore(file: BIDSFile) {
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
 * Deno implementation of .bidsignore style rules
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

  add(config: string[]): void {
    this.#ignore.add(config)
  }

  /** Test if a dataset relative path should be ignored given configured rules */
  test(path: string): boolean {
    // Paths come in with a leading slash, but ignore expects paths relative to root
    return this.#ignore.ignores(path.slice(1, path.length))
  }
}

import { BIDSFile } from '../types/file.ts'
import { ignore, Ignore } from '../deps/ignore.ts'
import { FileIgnoreRules } from '../types/ignore.ts'

export async function readBidsIgnore(file: BIDSFile) {
  const fileStream = await file.stream
  const reader = fileStream
    .pipeThrough(new TextDecoderStream('utf-8'))
    .getReader()
  const { value } = await reader.read()
  if (value) {
    const lines = value.split('\n')
    return lines
  } else {
    return []
  }
}

/**
 * Deno implementation of .bidsignore style rules
 */
export class FileIgnoreRulesDeno implements FileIgnoreRules {
  #ignore: Ignore

  constructor(config: string[]) {
    this.#ignore = ignore({ allowRelativePaths: true })
    this.#ignore.add(config)
  }

  add(config: string[]): void {
    this.#ignore.add(config)
  }

  /** Test if a dataset relative path should be ignored given configured rules */
  test(path: string): boolean {
    return this.#ignore.ignores(path)
  }
}

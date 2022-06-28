/**
 * Abstract FileTree for all environments (Deno, Browser, Python)
 */
import { BIDSFile } from '../types/file.ts'
import { FileIgnoreRules } from './ignore.ts'

export class FileTree {
  // Relative path to this FileTree location
  path: string
  // Name of this directory level
  name: string
  files: BIDSFile[]
  directories: FileTree[]
  parent?: FileTree
  // Reference to the .bidsignore (or configuration provided) rules
  ignore?: FileIgnoreRules

  constructor(
    path: string,
    name: string,
    parent?: FileTree,
    ignore?: FileIgnoreRules,
  ) {
    this.path = path
    this.files = []
    this.directories = []
    this.name = name
    this.parent = parent
    this.ignore = ignore
  }
}

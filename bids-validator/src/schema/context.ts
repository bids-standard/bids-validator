import { Context } from '../types/context.ts'
import { FileTree, BIDSFile } from '../files/filetree.ts'
import { BIDSEntities, readEntities } from './entities.ts'

export class BIDSContext implements Context {
  // Internal representation of the file tree
  #fileTree: FileTree
  file: BIDSFile
  suffix: string
  extension: string
  entities: Record<string, string>

  constructor(fileTree: FileTree, file: BIDSFile) {
    this.#fileTree = fileTree
    this.file = file
    const bidsEntities = readEntities(file)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
  }

  /**
   * Implementation specific absolute path for the dataset root
   *
   * In the browser, this is always at the root
   */
  get datasetPath(): string {
    return this.#fileTree.path
  }
}

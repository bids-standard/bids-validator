import { FileTree, BIDSFile } from '../files/filetree.ts'
import { BIDSEntities, readEntities } from './entities.ts'

export class BIDSContext {
  dataset: FileTree
  file: BIDSFile
  suffix: string
  extension: string
  entities: Record<string, string>

  constructor(dataset: FileTree, file: BIDSFile) {
    this.dataset = dataset
    this.file = file
    const bidsEntities = readEntities(file)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
  }
}

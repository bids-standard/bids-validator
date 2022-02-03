import { FileTree, BIDSFile } from '../files/filetree.ts'
import { BIDSEntities, readEntities } from './entities.ts'

export class BIDSContext {
  dataset: FileTree
  file: BIDSFile
  entities?: BIDSEntities

  constructor(dataset: FileTree, file: BIDSFile) {
    this.dataset = dataset
    this.file = file
    //this.entities = readEntities(dataset, file)
  }
}

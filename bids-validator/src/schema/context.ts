import {
  Context,
  ContextDataset,
  ContextSubject,
  ContextAssociations,
  ContextNiftiHeader,
} from '../types/context.ts'
import { FileTree, BIDSFile } from '../files/filetree.ts'
import { BIDSEntities, readEntities } from './entities.ts'

export class BIDSContext implements Context {
  // Internal representation of the file tree
  #fileTree: FileTree
  file: BIDSFile
  suffix: string
  extension: string
  entities: object
  dataset: ContextDataset
  subject: ContextSubject
  datatype: string
  modality: string
  sidecar: object
  associations: ContextAssociations
  columns: object
  json: object
  nifti_header: ContextNiftiHeader

  constructor(fileTree: FileTree, file: BIDSFile) {
    this.#fileTree = fileTree
    this.file = file
    const bidsEntities = readEntities(file)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
    this.dataset = {} as ContextDataset
    this.subject = {} as ContextSubject
    this.datatype = 'unimplemented'
    this.modality = 'unimplemented'
    this.sidecar = {}
    this.associations = {} as ContextAssociations
    this.columns = {}
    this.json = {}
    this.nifti_header = {} as ContextNiftiHeader
  }

  get path(): string {
    return this.datasetPath
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

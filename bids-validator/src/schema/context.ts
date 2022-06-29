import {
  Context,
  ContextDataset,
  ContextSubject,
  ContextAssociations,
  ContextNiftiHeader,
} from '../types/context.ts'
import { BIDSFile } from '../types/file.ts'
import { FileTree } from '../types/filetree.ts'
import { BIDSEntities, readEntities } from './entities.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'

export class BIDSContext implements Context {
  // Internal representation of the file tree
  #fileTree: FileTree
  issues: DatasetIssues
  file: BIDSFile
  suffix: string
  extension: string
  entities: Record<string, string>
  dataset: ContextDataset
  subject: ContextSubject
  datatype: string
  modality: string
  sidecar: object
  associations: ContextAssociations
  columns: object
  json: Record<string, any>
  nifti_header: ContextNiftiHeader

  constructor(fileTree: FileTree, file: BIDSFile, issues: DatasetIssues) {
    this.#fileTree = fileTree
    this.issues = issues
    this.file = file
    const bidsEntities = readEntities(file)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
    this.dataset = {} as ContextDataset
    this.subject = {} as ContextSubject
    this.datatype = ''
    this.modality = ''
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

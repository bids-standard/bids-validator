import {
  Context,
  ContextAssociations,
  ContextDataset,
  ContextDatasetSubjects,
  ContextNiftiHeader,
  ContextSubject,
} from '../types/context.ts'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { ColumnsMap } from '../types/columns.ts'
import { BIDSEntities, readEntities } from './entities.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { walkBack } from '../files/inheritance.ts'
import { loadTSV } from '../files/tsv.ts'
import { loadHeader } from '../files/nifti.ts'
import { buildAssociations } from './associations.ts'
import { ValidatorOptions } from '../setup/options.ts'
import { logger } from '../utils/logger.ts'

export class BIDSContextDataset implements ContextDataset {
  dataset_description: Record<string, unknown>
  options?: ValidatorOptions
  files: any[]
  tree: object
  ignored: any[]
  modalities: any[]
  subjects?: ContextDatasetSubjects
  sidecarKeyValidated: Set<string>

  constructor(options?: ValidatorOptions, description = {}) {
    this.dataset_description = description
    this.files = []
    this.tree = {}
    this.ignored = []
    this.modalities = []
    this.sidecarKeyValidated = new Set<string>()
    if (options) {
      this.options = options
    }
    if (
      !this.dataset_description.DatasetType &&
      this.dataset_description.GeneratedBy
    ) {
      this.dataset_description.DatasetType = 'derivative'
    } else if (!this.dataset_description.DatasetType) {
      this.dataset_description.DatasetType = 'raw'
    }
  }
}

export class BIDSContextDatasetSubjects implements ContextDatasetSubjects {
  sub_dirs: string[]
  participant_id?: string[]
  phenotype?: string[]

  constructor(
    sub_dirs?: string[],
    participant_id?: string[],
    phenotype?: string[],
  ) {
    this.sub_dirs = sub_dirs ? sub_dirs : []
    this.participant_id = participant_id
    this.phenotype = phenotype
  }
}

const defaultDsContext = new BIDSContextDataset()

export class BIDSContext implements Context {
  // Internal representation of the file tree
  fileTree: FileTree
  filenameRules: string[]
  issues: DatasetIssues
  file: BIDSFile
  suffix: string
  extension: string
  entities: Record<string, string>
  dataset: ContextDataset
  subject: ContextSubject
  datatype: string
  modality: string
  sidecar: Record<string, any>
  sidecarKeyOrigin: Record<string, string>
  json: object
  columns: ColumnsMap
  associations: ContextAssociations
  nifti_header?: ContextNiftiHeader

  constructor(
    fileTree: FileTree,
    file: BIDSFile,
    issues: DatasetIssues,
    dsContext?: BIDSContextDataset,
  ) {
    this.fileTree = fileTree
    this.filenameRules = []
    this.issues = issues
    this.file = file
    const bidsEntities = readEntities(file.name)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
    this.dataset = dsContext ? dsContext : defaultDsContext
    this.subject = {} as ContextSubject
    this.datatype = ''
    this.modality = ''
    this.sidecar = {}
    this.sidecarKeyOrigin = {}
    this.columns = new ColumnsMap()
    this.json = {}
    this.associations = {} as ContextAssociations
  }

  get size(): number {
    return this.file.size
  }

  get path(): string {
    return this.file.path
  }

  /**
   * Implementation specific absolute path for the dataset root
   *
   * In the browser, this is always at the root
   */
  get datasetPath(): string {
    return this.fileTree.path
  }

  /**
   * Walks the fileTree backwards from the current file to the root,
   * loading any valid json sidecars found.
   * Earlier (deeper) sidecars take precedence over later ones.
   */
  async loadSidecar() {
    if (this.extension === '.json') {
      return
    }
    const sidecars = walkBack(this.file)
    for (const file of sidecars) {
      const json = await file
        .text()
        .then((text) => JSON.parse(text))
        .catch((error) => {})
      this.sidecar = { ...json, ...this.sidecar }
      Object.keys(json).map((x) => this.sidecarKeyOrigin[x] ??= file.path)
    }
  }

  async loadNiftiHeader(): Promise<void> {
    if (
      this.extension.startsWith('.nii') &&
      this.dataset.options &&
      !this.dataset.options.ignoreNiftiHeaders
    ) {
      this.nifti_header = await loadHeader(this.file)
    }
  }

  async loadColumns(): Promise<void> {
    if (this.extension !== '.tsv') {
      return
    }

    this.columns = await loadTSV(this.file)
      .catch((error) => {
        if (error.key) {
          this.issues.addNonSchemaIssue(error.key, [this.file])
        }
        logger.warning(
          `tsv file could not be opened by loadColumns '${this.file.path}'`,
        )
        logger.debug(error)
        return new Map<string, string[]>() as ColumnsMap
      })
    return
  }

  async loadAssociations(): Promise<void> {
    this.associations = await buildAssociations(this.file, this.issues)
    return
  }

  async loadJSON(): Promise<void> {
    if (this.extension !== '.json') {
      return
    }
    this.json = await this.file
      .text()
      .then((text) => JSON.parse(text))
      .catch((error) => {})
  }

  // This is currently done for every file. It should be done once for the dataset.
  async loadSubjects(): Promise<void> {
    if (this.dataset.subjects != null) {
      return
    }
    this.dataset.subjects = new BIDSContextDatasetSubjects()
    // Load subject dirs from the file tree
    this.dataset.subjects.sub_dirs = this.fileTree.directories
      .filter((dir) => dir.name.startsWith('sub-'))
      .map((dir) => dir.name)

    // Load participants from participants.tsv
    const participants_tsv = this.fileTree.files.find(
      (file) => file.name === 'participants.tsv',
    )
    if (participants_tsv) {
      const participantsData = await loadTSV(participants_tsv)
      this.dataset.subjects.participant_id = participantsData[
        'participant_id'
      ] as string[]
    }

    // Load phenotype from phenotype/*.tsv
    const phenotype_dir = this.fileTree.directories.find(
      (dir) => dir.name === 'phenotype',
    )
    if (phenotype_dir) {
      const phenotypeFiles = phenotype_dir.files.filter((file) => file.name.endsWith('.tsv'))
      // Collect observed participant_ids
      const seen = new Set() as Set<string>
      for (const file of phenotypeFiles) {
        const phenotypeData = await loadTSV(file)
        const participant_id = phenotypeData['participant_id'] as string[]
        if (participant_id) {
          participant_id.forEach((id) => seen.add(id))
        }
      }
      this.dataset.subjects.phenotype = Array.from(seen)
    }
  }

  async asyncLoads() {
    await Promise.allSettled([
      this.loadSubjects(),
      this.loadSidecar(),
      this.loadColumns(),
      this.loadAssociations(),
      this.loadNiftiHeader(),
      this.loadJSON(),
    ])
  }
}

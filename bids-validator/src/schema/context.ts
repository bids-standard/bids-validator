import {
  Context,
  ContextAssociations,
  ContextDataset,
  ContextDatasetSubjects,
  ContextNiftiHeader,
  ContextSubject,
} from '../types/context.ts'
import { Schema } from '../types/schema.ts'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { ColumnsMap } from '../types/columns.ts'
import { readEntities } from './entities.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { walkBack } from '../files/inheritance.ts'
import { loadTSV } from '../files/tsv.ts'
import { loadJSON } from '../files/json.ts'
import { loadHeader } from '../files/nifti.ts'
import { buildAssociations } from './associations.ts'
import { ValidatorOptions } from '../setup/options.ts'
import { logger } from '../utils/logger.ts'

export class BIDSContextDataset implements ContextDataset {
  #dataset_description: Record<string, unknown> = {}
  tree: FileTree
  ignored: BIDSFile[]
  datatypes: string[]
  modalities: string[]
  subjects?: ContextDatasetSubjects

  issues: DatasetIssues
  sidecarKeyValidated: Set<string>
  options?: ValidatorOptions
  schema: Schema

  constructor(
    args: Partial<BIDSContextDataset>
  ) {
    this.schema = args.schema || {} as unknown as Schema
    this.dataset_description = args.dataset_description || {}
    this.tree = args.tree || new FileTree('/unknown', 'unknown')
    this.ignored = args.ignored || []
    this.datatypes = args.datatypes || []
    this.modalities = args.modalities || []
    this.sidecarKeyValidated = new Set<string>()
    if (args.options) {
      this.options = args.options
    }
    this.issues = args.issues || new DatasetIssues()
  }

  get dataset_description(): Record<string, unknown> {
    return this.#dataset_description
  }
  set dataset_description(value: Record<string, unknown>) {
    this.#dataset_description = value
    if (!this.dataset_description.DatasetType) {
      this.dataset_description.DatasetType = this.dataset_description.GeneratedBy
        ? 'derivative'
        : 'raw'
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

export class BIDSContext implements Context {
  dataset: BIDSContextDataset
  subject: ContextSubject
  // path: string  <- getter
  // size: number  <- getter
  entities: Record<string, string>
  datatype: string
  suffix: string
  extension: string
  modality: string
  sidecar: Record<string, any>
  associations: ContextAssociations
  columns: ColumnsMap
  json: object
  gzip?: object
  nifti_header?: ContextNiftiHeader
  ome?: object
  tiff?: object

  file: BIDSFile
  filenameRules: string[]
  sidecarKeyOrigin: Record<string, string>

  constructor(
    file: BIDSFile,
    dsContext?: BIDSContextDataset,
    fileTree?: FileTree,
  ) {
    this.filenameRules = []
    this.file = file
    const bidsEntities = readEntities(file.name)
    this.suffix = bidsEntities.suffix
    this.extension = bidsEntities.extension
    this.entities = bidsEntities.entities
    this.dataset = dsContext ? dsContext : new BIDSContextDataset({tree: fileTree})
    this.subject = {} as ContextSubject
    this.datatype = ''
    this.modality = ''
    this.sidecar = {}
    this.sidecarKeyOrigin = {}
    this.columns = new ColumnsMap()
    this.json = {}
    this.associations = {} as ContextAssociations
  }

  get schema(): Schema {
    return this.dataset.schema
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
    return this.dataset.tree.path
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
      const json = await loadJSON(file).catch((error) => {
        this.dataset.issues.addNonSchemaIssue(error.key, [file])
        return {}
      })
      this.sidecar = { ...json, ...this.sidecar }
      Object.keys(json).map((x) => this.sidecarKeyOrigin[x] ??= file.path)
    }
  }

  async loadNiftiHeader(): Promise<void> {
    if (
      !this.extension.startsWith('.nii') || this.dataset?.options?.ignoreNiftiHeaders
    ) return

    this.nifti_header = await loadHeader(this.file).catch((error) => {
      this.dataset.issues.addNonSchemaIssue(error.key, [this.file])
      return undefined
    })
  }

  async loadColumns(): Promise<void> {
    if (this.extension !== '.tsv') {
      return
    }

    this.columns = await loadTSV(this.file)
      .catch((error) => {
        if (error.key) {
          this.dataset.issues.addNonSchemaIssue(error.key, [this.file])
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
    this.associations = await buildAssociations(this.file, this.dataset.issues)
    return
  }

  async loadJSON(): Promise<void> {
    if (this.extension !== '.json') {
      return
    }
    this.json = await loadJSON(this.file).catch((error) => {
      this.dataset.issues.addNonSchemaIssue(error.key, [this.file])
      return {}
    })
  }

  // This is currently done for every file. It should be done once for the dataset.
  async loadSubjects(): Promise<void> {
    if (this.dataset.subjects != null) {
      return
    }
    this.dataset.subjects = new BIDSContextDatasetSubjects()
    // Load subject dirs from the file tree
    this.dataset.subjects.sub_dirs = this.dataset.tree.directories
      .filter((dir) => dir.name.startsWith('sub-'))
      .map((dir) => dir.name)

    // Load participants from participants.tsv
    const participants_tsv = this.dataset.tree.files.find(
      (file) => file.name === 'participants.tsv',
    )
    if (participants_tsv) {
      const participantsData = await loadTSV(participants_tsv)
      this.dataset.subjects.participant_id = participantsData[
        'participant_id'
      ] as string[]
    }

    // Load phenotype from phenotype/*.tsv
    const phenotype_dir = this.dataset.tree.directories.find(
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

import type {
  Associations,
  Context,
  Dataset,
  Gzip,
  NiftiHeader,
  Ome,
  Subject,
  Subjects,
  Tiff,
} from '@bids/schema/context'
import type { Schema } from '../types/schema.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { FileTree } from '../types/filetree.ts'
import { ColumnsMap } from '../types/columns.ts'
import { readEntities } from './entities.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { walkBack } from '../files/inheritance.ts'
import { parseGzip } from '../files/gzip.ts'
import { loadTSV } from '../files/tsv.ts'
import { parseTIFF } from '../files/tiff.ts'
import { loadJSON } from '../files/json.ts'
import { loadHeader } from '../files/nifti.ts'
import { buildAssociations } from './associations.ts'
import type { ValidatorOptions } from '../setup/options.ts'
import { logger } from '../utils/logger.ts'

export class BIDSContextDataset implements Dataset {
  #dataset_description: Record<string, unknown> = {}
  tree: FileTree
  ignored: string[]
  datatypes: string[]
  modalities: string[]
  subjects: Subjects

  issues: DatasetIssues
  sidecarKeyValidated: Set<string>
  options?: ValidatorOptions
  schema: Schema
  pseudofileExtensions: Set<string>
  opaqueDirectories: Set<string>

  // Opaque object for HED validator
  hedSchemas: object | undefined | null = undefined

  constructor(
    args: Partial<BIDSContextDataset>,
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
    this.pseudofileExtensions = new Set<string>(
      args.schema
        ? Object.values(this.schema.objects.extensions)
          ?.map((ext) => ext.value)
          ?.filter((ext) => ext.endsWith('/'))
        : [],
    )
    this.opaqueDirectories = new Set<string>(
      args.schema
        ? Object.values(this.schema.rules.directories.raw)
          ?.filter((rule) => rule?.opaque && 'name' in rule)
          ?.map((dir) => `/${dir.name}`)
        : [],
    )
    // @ts-ignore
    this.subjects = args.subjects || null
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

  isPseudoFile(file: FileTree): boolean {
    const { suffix, extension, entities } = readEntities(file.name)
    return (
      suffix !== '' &&
      Object.keys(entities).length > 0 &&
      this.pseudofileExtensions.has(`${extension}/`)
    )
  }
  isOpaqueDirectory(file: FileTree): boolean {
    return this.opaqueDirectories.has(file.path)
  }
}

class BIDSContextDatasetSubjects implements Subjects {
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
  subject: Subject
  // path: string  <- getter
  // size: number  <- getter
  entities: Record<string, string>
  datatype: string
  suffix: string
  extension: string
  modality: string
  sidecar: Record<string, any>
  associations: Associations
  columns: Record<string, string[]>
  json: Record<string, any>
  gzip?: Gzip
  nifti_header?: NiftiHeader
  ome?: Ome
  tiff?: Tiff
  directory?: boolean

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
    this.dataset = dsContext ? dsContext : new BIDSContextDataset({ tree: fileTree })
    this.subject = {} as Subject
    this.datatype = ''
    this.modality = ''
    this.sidecar = {}
    this.sidecarKeyOrigin = {}
    this.columns = new ColumnsMap() as Record<string, string[]>
    this.json = {}
    this.associations = {} as Associations
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
    let sidecars: BIDSFile[] = []
    try {
      sidecars = [...walkBack(this.file)]
    } catch (error) {
      if (
        error && typeof error === 'object' && 'code' in error &&
        error.code === 'MULTIPLE_INHERITABLE_FILES'
      ) {
        // @ts-expect-error
        this.dataset.issues.add(error)
      } else {
        throw error
      }
    }
    for (const file of sidecars) {
      const json = await loadJSON(file).catch((error) => {
        if (error.key) {
          this.dataset.issues.add({ code: error.key, location: file.path })
          return {}
        } else {
          throw error
        }
      })
      this.sidecar = { ...json, ...this.sidecar }
      Object.keys(json).map((x) => this.sidecarKeyOrigin[x] ??= file.path)
    }
    // Hack: round RepetitionTime to 3 decimal places; schema should add rounding function
    if (typeof this.sidecar.RepetitionTime === 'number') {
      this.sidecar.RepetitionTime = Math.round(this.sidecar.RepetitionTime * 1000) / 1000
    }
  }

  async loadNiftiHeader(): Promise<void> {
    if (
      !this.extension.startsWith('.nii') || this.dataset?.options?.ignoreNiftiHeaders
    ) return

    this.nifti_header = await loadHeader(this.file).catch((error) => {
      if (error.key) {
        this.dataset.issues.add({ code: error.key, location: this.file.path })
        return undefined
      } else {
        throw error
      }
    })
  }

  async loadColumns(): Promise<void> {
    if (this.extension !== '.tsv') {
      return
    }

    this.columns = await loadTSV(this.file, this.dataset.options?.maxRows)
      .catch((error) => {
        if (error.key) {
          this.dataset.issues.add({ code: error.key, location: this.file.path })
        }
        logger.warn(
          `tsv file could not be opened by loadColumns '${this.file.path}'`,
        )
        logger.debug(error)
        return new Map<string, string[]>() as ColumnsMap
      }) as Record<string, string[]>
    return
  }

  async loadAssociations(): Promise<void> {
    this.associations = await buildAssociations(
      this,
    )
    return
  }

  async loadJSON(): Promise<void> {
    if (this.extension !== '.json') {
      return
    }
    this.json = await loadJSON(this.file).catch((error) => {
      if (error.key) {
        this.dataset.issues.add({ code: error.key, location: this.file.path })
        return {}
      } else {
        throw error
      }
    })
  }

  async loadGzip(): Promise<void> {
    if (!this.extension.endsWith('.gz')) {
      return
    }
    this.gzip = await parseGzip(this.file, 512).catch((error) => {
      logger.debug('Error parsing gzip header', error)
      return undefined
    })
  }

  async loadTIFF(): Promise<void> {
    if (!this.extension.endsWith('.tif') && !this.extension.endsWith('.btf')) {
      return
    }
    const { tiff, ome } = await parseTIFF(this.file, this.extension.startsWith('.ome')).catch(
      (error) => {
        logger.debug('Error parsing tiff header', error)
        return { tiff: undefined, ome: undefined }
      },
    )
    this.tiff = tiff
    this.ome = ome
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
    const participants_tsv = this.dataset.tree.get('participants.tsv') as BIDSFile
    if (participants_tsv) {
      const participantsData = await loadTSV(participants_tsv)
      this.dataset.subjects.participant_id = participantsData[
        'participant_id'
      ] as string[]
    }

    // Load phenotype from phenotype/*.tsv
    const phenotype_dir = this.dataset.tree.get('phenotype') as FileTree
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
      this.loadGzip(),
      this.loadTIFF(),
    ])
  }
}

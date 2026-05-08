import type { DatasetIssues } from '../issues/datasetIssues.ts'

/** Per-participant demographics extracted from `participants.tsv`. */
export interface SubjectMetadata {
  /** BIDS participant label, e.g. `"sub-01"`. */
  participantId: string
  /**
   * Participant age in years.
   *
   * The string literal `'89+'` is used instead of a numeric value when the
   * participant is 89 years or older, following HIPAA safe-harbour de-
   * identification rules that require top-coding at that threshold.
   */
  age?: number | null | '89+'
  /** Biological sex as recorded in the participants file, e.g. `"M"`, `"F"`. */
  sex?: string
}
/*
    BodyPart: {},
    ScannerManufacturer: {},
    ScannerManufacturersModelName: {},
    TracerName: {},
    TracerRadionuclide: {},
*/

/** Aggregated run statistics produced by a validation pass. */
export interface SummaryOutput {
  /** Unique session labels found across the dataset. */
  sessions: string[]
  /** Unique subject labels found across the dataset. */
  subjects: string[]
  /** Per-participant demographics extracted from `participants.tsv`. */
  subjectMetadata: SubjectMetadata[]
  /** Task names referenced by filenames across the dataset. */
  tasks: string[]
  /** Primary modality names detected (e.g. `"MRI"`, `"EEG"`). */
  modalities: string[]
  /** Secondary or derived modalities detected. */
  secondaryModalities: string[]
  /** Total number of files in the dataset. */
  totalFiles: number
  /** Total size of all files in bytes. */
  size: number
  /** `true` when the dataset's `DatasetType` is `"derivative"`. */
  dataProcessed: boolean
  /** PET-specific metadata extracted from the dataset. */
  pet: Record<string, unknown>
  /** BIDS data-type directories found (e.g. `["anat", "func"]`). */
  dataTypes: string[]
  /** Version of the BIDS schema used during validation. */
  schemaVersion: string
}

/**
 * The output of a validation run
 */
export interface ValidationResult {
  /** Issues accumulated during the validation run. */
  issues: DatasetIssues
  /** Aggregated dataset statistics for the run. */
  summary: SummaryOutput
  /**
   * Validation results for derivative datasets nested under `derivatives/`.
   *
   * The map key is the derivative subdirectory name. Only populated when
   * `options.recursive` is set and derivative datasets carry their own
   * `dataset_description.json`.
   */
  derivativesSummary?: Record<string, ValidationResult>
}

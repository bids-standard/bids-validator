import type { DatasetIssues } from '../issues/datasetIssues.ts'

/** Per-participant demographics extracted from `participants.tsv`. */
export interface SubjectMetadata {
  participantId: string
  age?: number | null | '89+'
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
  sessions: string[]
  subjects: string[]
  subjectMetadata: SubjectMetadata[]
  tasks: string[]
  modalities: string[]
  secondaryModalities: string[]
  totalFiles: number
  size: number
  dataProcessed: boolean
  pet: Record<string, unknown>
  dataTypes: string[]
  schemaVersion: string
}

/**
 * The output of a validation run
 */
export interface ValidationResult {
  issues: DatasetIssues
  summary: SummaryOutput
  derivativesSummary?: Record<string, ValidationResult>
}

import { DatasetIssues } from '../issues/datasetIssues.ts'

interface SubjectMetadata {
  PARTICIPANT_ID: string
  age: string
  sex: string
  group: string
}
/*
    BodyPart: {},
    ScannerManufacturer: {},
    ScannerManufacturersModelName: {},
    TracerName: {},
    TracerRadionuclide: {},
*/

export interface Summary {
  sessions: string[]
  subjects: string[]
  subjectMetadata: SubjectMetaData[]
  tasks: string[]
  modalities: string[]
  secondaryModalities: string[]
  totalFiles: number
  size: number
  dataProcessed: boolean
  pet: Record<string, any>
}

/**
 * The output of a validation run
 */
export interface ValidationResult {
  issues: DatasetIssues
  summary: Summary
}

import { DatasetIssues } from '../issues/datasetIssues.ts'

/**
 * The output of a validation run
 */
export interface ValidationResult {
  issues: DatasetIssues
  summary: Record<string, any>
}

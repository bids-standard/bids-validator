export type Severity = 'warning' | 'error' | 'ignore'

export interface IssueFileDetail {
  name: string
  path: string
  relativePath: string
}

export interface IssueFile {
  key: string
  code: number
  file: IssueFileDetail
  evidence: string
  line: number
  character: number
  severity: Severity
  reason: string
  helpUrl: string
}

/**
 * Dataset issue, derived from OpenNeuro schema and existing validator implementation
 */
export interface Issue {
  severity: Severity
  key: string
  code: number
  reason: string
  files: IssueFile[]
  additionalFileCount: number
  helpUrl: string
}

/**
 * For defining internal issues quickly
 */
export interface IssueDefinition {
  severity: Severity
  reason: string
}
export type IssueDefinitionRecord = Record<string, IssueDefinition>

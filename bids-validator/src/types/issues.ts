import { BIDSFile } from './filetree.ts'

const all_severities = ['warning', 'error', 'ignore'] as const
export type Severity = typeof all_severities[number]

/**
 * Updated internal Issue structure for schema based validation
 */
export interface Issue {
  code: string
  subCode?: string
  severity?: Severity
  location?: string
  issueMessage?: string
  suggestion?: string
  affects?: string[]
  rule?: string
  line?: number
  character?: number
}

export interface IssueFileDetail {
  name: string
  path: string
  relativePath: string
}

export interface IssueFileOutput {
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
 * For defining internal issues quickly
 */
export interface IssueDefinition {
  severity: Severity
  reason: string
}
export type IssueDefinitionRecord = Record<string, IssueDefinition>

/**
 * File allowing extra context for the issue found
 */
export type IssueFile = Omit<BIDSFile, 'readBytes'> & {
  evidence?: string
  line?: number
  character?: number
}

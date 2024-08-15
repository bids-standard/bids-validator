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

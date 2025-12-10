import type { BIDSFile } from './filetree.ts'

export type Severity = 'warning' | 'error' | 'ignore'

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
 * Filter an Issue to only include relevant fields for reporting
 * This allows us to accept issues from different validators with extra fields
 */
export function filterIssue(issue: Issue): Issue {
  // Unfortunately, no way to keep this synced with the Issue interface automatically
  const {
    code,
    subCode,
    severity,
    location,
    issueMessage,
    suggestion,
    affects,
    rule,
    line,
    character,
  } = issue
  return {
    code,
    subCode,
    severity,
    location,
    issueMessage,
    suggestion,
    affects,
    rule,
    line,
    character,
  }
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

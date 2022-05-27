import { BIDSFile } from '../files/filetree.ts'
import { nonSchemaIssues } from './list.ts'
import { constructHelpUrl } from './formatting.ts'
import { Issue, IssueFile, Severity } from '../types/issues.ts'

// Code is deprecated, return something unusual but JSON serializable
const CODE_DEPRECATED = Number.MIN_SAFE_INTEGER

// Extended BIDSFile to add Issue related context
export type BIDSFileIssue = BIDSFile & {
  evidence?: string
  reason?: string
  line?: number
  character?: number
}

type DatasetIssueFile = IssueFile | BIDSFileIssue

// Guard to test for anything except IssueFile
function isNotIssueFile(f: DatasetIssueFile): f is BIDSFileIssue {
  return (
    (f as BIDSFileIssue).path !== undefined &&
    (f as BIDSFileIssue).name !== undefined
  )
}

/**
 * Format an internal file reference with context as the output IssueFile type
 */
const issueFile =
  (key: string, severity: Severity) =>
  (f: DatasetIssueFile): IssueFile => {
    if (isNotIssueFile(f)) {
      const evidence = f.evidence || ''
      const reason = f.reason || ''
      const line = f.line || 0
      const character = f.character || 0
      return {
        key,
        code: CODE_DEPRECATED,
        file: { path: f.path, name: f.name, relativePath: f.path },
        evidence,
        line,
        character,
        severity: severity,
        reason,
        helpUrl: constructHelpUrl(key),
      }
    } else {
      return f
    }
  }

interface DatasetIssuesAddParams {
  key: string
  reason: string
  severity?: Severity
  additionalFileCount?: number
  files?: Array<DatasetIssueFile>
}

/**
 * Management class for dataset issues
 */
export class DatasetIssues {
  // Issue key to issue mapping
  issues: Map<string, Issue>

  constructor() {
    this.issues = new Map()
  }

  add({
    key,
    reason,
    severity = 'error',
    additionalFileCount = 0,
    files,
  }: DatasetIssuesAddParams): Issue {
    const existingIssue = this.issues.get(key)
    const code = CODE_DEPRECATED
    // Provide a link to NeuroStars
    const helpUrl = constructHelpUrl(key)
    // Handle both the shorthand BIDSFile array or full IssueFile
    const relatedFiles =
      files && files.length > 0 ? files.map(issueFile(key, severity)) : []
    if (existingIssue) {
      existingIssue.files.push(...relatedFiles)
      // Should we drop the additionalFileCount concept?
      existingIssue.additionalFileCount += additionalFileCount
      return existingIssue
    } else {
      const newIssue: Issue = {
        severity,
        key,
        code,
        reason,
        files: relatedFiles,
        additionalFileCount,
        helpUrl,
      }
      this.issues.set(key, newIssue)
      return newIssue
    }
  }

  /**
   * Add an existing issue or merge if the same key already exists from an array of Issue objects
   * @param issues
   */
  merge(issues: Issue[]) {
    for (const issue of issues) {
      const exists = this.issues.get(issue.key)
      if (exists) {
        exists.files.push(...issue.files)
      } else {
        this.issues.set(issue.key, issue)
      }
    }
  }

  // Shorthand to test if an issue has occurred
  hasIssue({ key }: { key: string }): boolean {
    if (this.issues.has(key)) {
      return true
    }
    return false
  }

  addNonSchemaIssue(
    key: string,
    files: Array<DatasetIssueFile>,
    additionalFileCount: number = 0,
  ) {
    if (nonSchemaIssues.hasOwnProperty(key)) {
      this.add({
        key,
        reason: nonSchemaIssues[key].reason,
        severity: nonSchemaIssues[key].severity,
        additionalFileCount,
        files,
      })
    } else {
      throw new Error('key does not exist in non-schema issues definitions')
    }
  }

  fileInIssues(path: string): Issue[] {
    const matchingIssues = []
    for (const [key, issue] of this.issues) {
      if (issue.files.some((f) => f.file.path === path)) {
        matchingIssues.push(issue)
      }
    }
    return matchingIssues
  }

  /**
   * Report Issue keys related to a file
   * @param path File path relative to dataset root
   * @returns Array of matching issue keys
   */
  getFileIssueKeys(path: string): string[] {
    return this.fileInIssues(path).map((issue) => issue.key)
  }
}

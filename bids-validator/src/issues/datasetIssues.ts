import { BIDSFile, isBIDSFile } from '../files/filetree.ts'
import { nonSchemaIssues } from './list.ts'
import { constructHelpUrl } from './formatting.ts'
import { Issue, IssueFile, Severity } from '../types/issues.ts'

/**
 * Management class for dataset issues
 */
export class DatasetIssues {
  // Issue key to issue mapping
  issues: Map<string, Issue>
  constructor() {
    this.issues = new Map()
  }

  add(
    key: string,
    severity: Severity = 'warning',
    reason: string,
    additionalFileCount = 0,
    files?: Array<BIDSFile | IssueFile>,
  ): Issue {
    const existingIssue = this.issues.get(key)
    // Code is deprecated, return something unusual but JSON serializable
    const code = Number.MIN_SAFE_INTEGER
    // Provide a link to NeuroStars
    const helpUrl = constructHelpUrl(key)
    // Handle both the shorthand BIDSFile array or full IssueFile
    const relatedFiles =
      files && files.length > 0
        ? files.map((f) => {
            if (isBIDSFile(f)) {
              return {
                key,
                code,
                file: { path: f.path, name: f.name, relativePath: f.path },
                evidence: '',
                line: 0,
                character: 0,
                severity: severity,
                reason: '',
                helpUrl,
              }
            } else {
              return f
            }
          })
        : []
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

  addNonSchemaIssue(
    key: string,
    files: Array<BIDSFile | IssueFile>,
    additionalFileCount?: number,
  ) {
    if (nonSchemaIssues.hasOwnProperty(key)) {
      this.add(
        key,
        nonSchemaIssues[key].severity,
        nonSchemaIssues[key].reason,
        additionalFileCount,
        files,
      )
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

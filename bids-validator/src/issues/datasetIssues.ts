import { nonSchemaIssues } from './list.ts'
import {
  FullTestIssuesReturn,
  Issue,
  IssueFileOutput,
  IssueOutput,
  Severity,
} from '../types/issues.ts'

// Code is deprecated, return something unusual but JSON serializable
const CODE_DEPRECATED = Number.MIN_SAFE_INTEGER

export class DatasetIssues {
  issues: Issue[]
  codeMessages: Map<string, string>

  constructor() {
    this.issues = []
    this.codeMessages = new Map()
  }

  add(issue: Issue) {
    if (!issue.codeMessage) {
      if (issue.code in nonSchemaIssues) {
        issue.codeMessage = nonSchemaIssues[issue.code].reason
        issue.severity ??= nonSchemaIssues[issue.code].severity
      } else {
        throw new Error(
          `key: ${issue.code} does not exist in non-schema issues definitions`,
        )
      }
    }
    issue.severity ??= 'error'
    if (!this.codeMessages.has(issue.code)) {
      this.codeMessages.set(issue.code, issue.codeMessage)
    }
    this.issues.push(issue)
  }

  get(issue: Partial<Issue>): Issue[] {
    let found: Issue[] = this.issues
    for (const key in issue) {
      const value = issue[key as keyof Issue]
      if (!value) {
        continue
      }
      found = found.filter((x) => x[key as keyof Issue] === value)
    }
    return found
  }

  filter(query: Partial<Issue>): DatasetIssues {
    const results = new DatasetIssues()
    const found = this.get(query)
    for (const issue of found) {
      results.add(issue)
    }
    return results
  }

  get size(): number {
    return this.issues.length
  }
}

function helpUrl(code: string): string {
  // Provide a link to NeuroStars
  return `https://neurostars.org/search?q=${code}`
}

const legacyIssueFile = (issue: Issue): IssueFileOutput => {
  const evidence = issue.issueMessage || ''
  const reason = issue.codeMessage || ''
  const line = 0
  const character = 0
  const path = issue.location || ''
  return {
    key: issue.code,
    code: CODE_DEPRECATED,
    file: { path, name: '', relativePath: '' },
    evidence,
    line,
    character,
    severity: issue.severity || 'error',
    reason,
    helpUrl: helpUrl(issue.code),
  }
}

export function legacyOutput(datasetIssues: DatasetIssues): FullTestIssuesReturn {
  const output: FullTestIssuesReturn = {
    errors: [],
    warnings: [],
  }
  for (const [code, codeMessage] of datasetIssues.codeMessages) {
    const issues = datasetIssues.filter({ code })

    const severities: [Severity, IssueOutput[]][] = [['warning', output.warnings], [
      'error',
      output.errors,
    ]]
    for (const [severity, _output] of severities) {
      if (!severity) continue
      const issuesBySeverity = issues.get({ severity })
      if (issuesBySeverity.length === 0) {
        continue
      }

      _output.push({
        severity: severity,
        key: code,
        code: CODE_DEPRECATED,
        reason: codeMessage,
        files: issuesBySeverity.map(legacyIssueFile),
        additionalFileCount: issuesBySeverity.length,
        helpUrl: helpUrl(code),
      })
    }
  }
  return output
}

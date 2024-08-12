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

type Group = Map<Issue[keyof Issue], DatasetIssues | Group | undefined>

export class DatasetIssues {
  issues: Issue[]
  codeMessages: Map<string, string>

  constructor() {
    this.issues = []
    this.codeMessages = new Map()
  }

  add(issue: Issue, codeMessage?: string) {
    if (!codeMessage) {
      if (issue.code in nonSchemaIssues) {
        codeMessage = nonSchemaIssues[issue.code].reason
        issue.severity ??= nonSchemaIssues[issue.code].severity
      } else {
        throw new Error(
          `key: ${issue.code} does not exist in non-schema issues definitions`,
        )
      }
    }
    issue.severity ??= 'error'
    if (!this.codeMessages.has(issue.code)) {
      this.codeMessages.set(issue.code, codeMessage)
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
      results.add(issue, this.codeMessages.get(issue.code))
    }
    return results
  }

  get size(): number {
    return this.issues.length
  }

  groupBy(key: keyof Issue): Map<Issue[keyof Issue], DatasetIssues> {
    let groups: Map<Issue[keyof Issue], DatasetIssues> = new Map()
    groups.set('None', new DatasetIssues())
    this.issues.map((issue) => {
      let value: Issue[keyof Issue] = 'None'
      if (key in issue && issue[key]) {
        value = issue[key]
      }
      if (!groups.has(value)) {
        groups.set(value, new DatasetIssues())
      }
      // @ts-expect-error TS2532 return of get possible undefined. Does the above 'has' catch this case?
      groups.get(value).add(issue, this.codeMessages.get(issue.code))
    })
    return groups
  }
  _groupBy(keys: Array<keyof Issue>): Group | undefined {
    if (keys.length === 1) {
      return this.groupBy(keys[0])
    }
    let issueKey = keys.pop()
    if (!issueKey) return undefined
    let groups: Group = new Map()
    for (const [key, issues] of this.groupBy(issueKey).entries()) {
      groups.set(key, issues._groupBy(keys))
    }
    return groups
  }
}

function helpUrl(code: string): string {
  // Provide a link to NeuroStars
  return `https://neurostars.org/search?q=${code}`
}

const legacyIssueFile = (issue: Issue, reason: string): IssueFileOutput => {
  const evidence = issue.issueMessage || ''
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
        files: issuesBySeverity.map((x) => legacyIssueFile(x, codeMessage)),
        additionalFileCount: issuesBySeverity.length,
        helpUrl: helpUrl(code),
      })
    }
  }
  return output
}

import { default as ignore } from '@ignore'
import { nonSchemaIssues } from './list.ts'
import type { Issue, IssueDefinition, IssueFile, Severity } from '../types/issues.ts'
import { filterIssue } from '../types/issues.ts'
export type { Issue, IssueDefinition, IssueFile, Severity }

// Code is deprecated, return something unusual but JSON serializable
const CODE_DEPRECATED = Number.MIN_SAFE_INTEGER

type Group = Map<Issue[keyof Issue], DatasetIssues | Group | undefined>

export class DatasetIssues {
  issues: Issue[]
  codeMessages: Map<string, string>

  constructor(
    { issues, codeMessages }: { issues?: Issue[]; codeMessages?: Map<string, string> } = {},
  ) {
    this.issues = issues ?? []
    this.codeMessages = codeMessages ?? new Map()
  }

  add(issue: Issue, codeMessage?: string) {
    // Ensure only relevant fields are kept, for protection when working with
    // external validators
    issue = filterIssue(issue)
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
      if (key === 'location' && typeof value === 'string' && !value.startsWith('/')) {
        const key_ignore = ignore().add(value as string)
        found = found.filter((x) => x[key] && key_ignore.ignores(x[key].slice(1, x[key].length)))
      } else {
        found = found.filter((x) => x[key as keyof Issue] === value)
      }
    }
    return found
  }

  filter(query: Partial<Issue>): DatasetIssues {
    const issues = this.get(query)
    const codes = new Set<string>(query.code ? [query.code] : issues.map((issue) => issue.code))
    const codeMessages = new Map([...this.codeMessages].filter(([code]) => codes.has(code)))

    return new DatasetIssues({ issues, codeMessages })
  }

  get size(): number {
    return this.issues.length
  }

  groupBy(key: keyof Issue): Map<Issue[keyof Issue], DatasetIssues> {
    const groups: Map<Issue[keyof Issue], DatasetIssues> = new Map()
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
    if (groups.has('None') && groups.get('None')?.size === 0) {
      groups.delete('None')
    }
    return groups
  }
}

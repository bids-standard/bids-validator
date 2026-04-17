import { default as ignore } from '@ignore'
import { nonSchemaIssues } from './list.ts'
import type { Issue, IssueDefinition, IssueFile, Severity } from '../types/issues.ts'
import { filterIssue } from '../types/issues.ts'
export type { Issue, IssueDefinition, IssueFile, Severity }

// Code is deprecated, return something unusual but JSON serializable
const _CODE_DEPRECATED = Number.MIN_SAFE_INTEGER

/**
 * Thrown by {@link DatasetIssues.add} when the caller supplies an issue
 * whose `code` is not defined in the non-schema issue catalogue and does
 * not pass a `codeMessage` argument to describe it.
 */
export class UnknownIssueCodeError extends Error {
  readonly code: string
  constructor(code: string) {
    super(`key: ${code} does not exist in non-schema issues definitions`)
    this.name = 'UnknownIssueCodeError'
    this.code = code
  }
}

type Group = Map<Issue[keyof Issue], DatasetIssues | Group | undefined>

/**
 * Container for {@link Issue}s accumulated during validation.
 *
 * Holds a flat list of issues plus a `codeMessages` map that records the
 * human-readable description for each distinct issue code seen so far.
 * Most validators interact with a `DatasetIssues` via the `issues`
 * property of a `BIDSContext` or `BIDSContextDataset` rather than
 * constructing one directly.
 */
export class DatasetIssues {
  issues: Issue[]
  codeMessages: Map<string, string>

  constructor(
    { issues, codeMessages }: { issues?: Issue[]; codeMessages?: Map<string, string> } = {},
  ) {
    this.issues = issues ?? []
    this.codeMessages = codeMessages ?? new Map()
  }

  /**
   * Append an issue to the collection.
   *
   * If `codeMessage` is not provided, `add` looks up `issue.code` in the
   * built-in non-schema issue catalogue and uses its description and
   * default severity. The catalogue is defined in
   * `src/issues/list.ts`.
   *
   * @param issue - The issue to record. Only the fields recognised by
   *   `filterIssue` are kept; extras are dropped to protect against
   *   payloads from external validators.
   * @param codeMessage - Optional human-readable description for
   *   `issue.code`. Required when `issue.code` is not in the non-schema
   *   issue catalogue.
   * @throws {Error} If `codeMessage` is not provided and `issue.code`
   *   is not a key in the non-schema issue catalogue.
   */
  add(issue: Issue, codeMessage?: string) {
    // Ensure only relevant fields are kept, for protection when working with
    // external validators
    issue = filterIssue(issue)
    if (!codeMessage) {
      if (issue.code in nonSchemaIssues) {
        codeMessage = nonSchemaIssues[issue.code].reason
        issue.severity ??= nonSchemaIssues[issue.code].severity
      } else {
        throw new UnknownIssueCodeError(issue.code)
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

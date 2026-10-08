import type { BIDSFile } from './filetree.ts'

/**
 * Severity level for a validation issue.
 *
 * - `'error'` — the dataset does not conform to the specification; treated as
 *   a hard failure by {@link [validate].detectErrors}.
 * - `'warning'` — potential problem that does not constitute a hard failure;
 *   can be suppressed via `ValidatorOptions.ignoreWarnings`.
 * - `'ignore'` — the issue is explicitly silenced, typically via a
 *   {@link [validate].Config} override.
 */
export type Severity = 'warning' | 'error' | 'ignore'

/**
 * Updated internal Issue structure for schema based validation
 */
export interface Issue {
  /** Issue code identifying the rule that was violated (e.g. `"MISSING_SESSION"`). */
  code: string
  /** Optional sub-code providing finer-grained categorisation within a `code`. */
  subCode?: string
  /** Severity of the issue; defaults to `'error'` when not provided. */
  severity?: Severity
  /** Dataset-relative path of the file or directory that triggered the issue. */
  location?: string
  /** Human-readable explanation of why this issue was raised. */
  issueMessage?: string
  /** Optional remediation hint for the person fixing the issue. */
  suggestion?: string
  /** Participant or entity labels affected by the issue. */
  affects?: string[]
  /** Schema rule path that produced the issue (e.g. `"rules.files.raw.anat.T1w"`). */
  rule?: string
  /** Line number within the file where the issue was detected (1-based). */
  line?: number
  /** Column number within the line where the issue was detected (1-based). */
  character?: number
}

/**
 * Normalise an arbitrary record to only the fields recognised by {@link Issue}.
 *
 * External validators may attach extra properties to their issue objects;
 * this function strips those extras so they do not propagate into the
 * {@link [issues].DatasetIssues} container. There is no automatic mechanism
 * to keep this function in sync with the `Issue` interface — update both
 * together when fields are added or removed.
 *
 * @param issue - The raw issue record to filter.
 * @returns A new object containing only the keys declared on {@link Issue}.
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
  /** Default severity assigned to this issue when no override is configured. */
  severity: Severity
  /** Human-readable explanation of this issue shown in validation reports. */
  reason: string
}
export type IssueDefinitionRecord = Record<string, IssueDefinition>

/**
 * An {@link Issue} that is associated with a specific file, optionally
 * annotated with the exact text evidence and source coordinates.
 */
export type IssueFile = Omit<BIDSFile, 'readBytes'> & {
  /** Snippet of file content that triggered the issue. */
  evidence?: string
  /** Line number within the file where the issue was detected (1-based). */
  line?: number
  /** Column number within the line where the issue was detected (1-based). */
  character?: number
}

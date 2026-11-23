/**
 * Issue types and the {@link DatasetIssues} container.
 *
 * Validation results aggregate issues into a {@link DatasetIssues}
 * instance; individual issue records conform to {@link Issue}. Use
 * {@link filterIssue} to normalise an arbitrary record before
 * comparison. {@link UnknownIssueCodeError} is thrown by
 * {@link DatasetIssues.add} when an issue's `code` is not recognised
 * and no `codeMessage` is supplied.
 * Loaders throw {@link IssueError}, which wraps the {@link Issue} to report.
 *
 * @module
 */

export { DatasetIssues, IssueError, UnknownIssueCodeError } from '../../issues/datasetIssues.ts'
export { filterIssue } from '../../types/issues.ts'
export type { Issue, IssueDefinition, IssueFile, Severity } from '../../types/issues.ts'

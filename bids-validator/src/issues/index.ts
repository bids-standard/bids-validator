import { nonSchemaIssues } from './list.ts'
interface FileIssue {
  file: string
  evidence: string
  line?: number
  character?: number
}

interface Issue {
  severity: Severity
  code: string
  reason: string
  files: [FileIssue?]
}

export const issues: Record<string, Issue> = {}

export function addIssue(
  issue: FileIssue,
  code: string,
  level?: string,
  message?: string,
) {
  console.log('adding issue')
  if (issues.hasOwnProperty(code)) {
    issues[issue.code].files.append(issue)
  } else {
    if (message && level && nonSchemaIssues.hasOwnProperty(code)) {
      let { message, level } = nonSchemaIssues[code]
    } else {
      message = ''
      level = ''
    }
    issues[code] = {
      severity: level,
      code: code,
      reason: message,
      files: [issue],
    }
  }
}

export const filenameIssues = {
  INVALID_ENTITY_LABEL: {
    level: warning,
    message: "entity label doesn't match format found for files with this suffix"
  },
  ENTITY_WITH_NO_LABEL: {
    level: "error",
    message: "Found an entity with no label."
  },
  MISSING_REQUIRED_ENTITY: {
    level: "error",
    message: "Missing required entity for files with this suffix."
  },
  ENTITY_NOT_IN_RULE: {
    level: "error",
    message: "Entity not listed as required or optional for files with this suffix"
  }
}

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

export const issues: Record<string, Issue>= {}

export function addIssue(issue: FileIssue, code: string, level?: string, message?: string) {
  if issues.hasOwnProperty(code) {
    issues[issue.code].files.append(issue)
  } else {
    if !(message && level && allIssues.hasOwnProperty(code)) {
      {message, level} = allIssues[code]
    } else {
      message = ''
      level = ''
    }
    issues[code] = {
      severity: level,
      code: code,
      reason: message
      files: [issue],
    }
  }
}

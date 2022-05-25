import { IssueDefinitionRecord } from '../types/issues.ts'

export const filenameIssues: IssueDefinitionRecord = {
  INVALID_ENTITY_LABEL: {
    severity: 'error',
    reason:
      "entity label doesn't match format found for files with this suffix",
  },
  ENTITY_WITH_NO_LABEL: {
    severity: 'error',
    reason: 'Found an entity with no label.',
  },
  MISSING_REQUIRED_ENTITY: {
    severity: 'error',
    reason: 'Missing required entity for files with this suffix.',
  },
  ENTITY_NOT_IN_RULE: {
    severity: 'error',
    reason:
      'Entity not listed as required or optional for files with this suffix',
  },
  DATATYPE_MISMATCH: {
    severity: 'error',
    reason:
      'The datatype directory does not match datatype of found suffix and extension',
  },
}

export const nonSchemaIssues = { ...filenameIssues }

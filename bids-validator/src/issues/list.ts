export const filenameIssues = {
  INVALID_ENTITY_LABEL: {
    level: 'error',
    message:
      "entity label doesn't match format found for files with this suffix",
  },
  ENTITY_WITH_NO_LABEL: {
    level: 'error',
    message: 'Found an entity with no label.',
  },
  MISSING_REQUIRED_ENTITY: {
    level: 'error',
    message: 'Missing required entity for files with this suffix.',
  },
  ENTITY_NOT_IN_RULE: {
    level: 'error',
    message:
      'Entity not listed as required or optional for files with this suffix',
  },
}

export const nonSchemaIssues = { ...filenameIssues }

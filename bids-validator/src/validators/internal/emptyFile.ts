import { ContextCheckFunction } from '../../types/check.ts'

// Non-schema EMPTY_FILE implementation
export const emptyFile: ContextCheckFunction = (schema, context) => {
  if (context.file.size === 0) {
    context.dataset.issues.addNonSchemaIssue('EMPTY_FILE', [context.file])
  }
  return Promise.resolve()
}

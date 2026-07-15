import type { ContextCheckFunction } from '../../types/check.ts'

// Non-schema EMPTY_FILE implementation
export const emptyFile: ContextCheckFunction = (_schema, context) => {
  if (context.file.size === 0 && !context.directory) {
    context.dataset.issues.add({
      code: 'EMPTY_FILE',
      location: context.path,
    })
  }
}

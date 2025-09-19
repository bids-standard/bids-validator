import type { ContextCheckFunction } from '../types/check.ts'

export const filenameCase: ContextCheckFunction = (schema, context) => {
    const caseCollision = context.file.parent?.files.filter(otherFile => {
      return (context.file.name.toLowerCase() === otherFile.name.toLowerCase() && context.file.name != otherFile.name)
    })
    if (caseCollision?.length) {
      context.dataset.issues.add({
        code: 'CASE_COLLISION',
        location: context.path,
        affects: caseCollision.map(file => file.path)
      })
    }
  return Promise.resolve()
}

import type { ContextCheckFunction } from '../types/check.ts'

export const filenameCase: ContextCheckFunction = (schema, context) => {
    const lowercase = context.file.name.toLowerCase()
    const caseCollision = context.file.parent?.files.filter(otherFile => {
      return (otherFile != context.file && otherFile.name.toLowerCase() === lowercase)
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

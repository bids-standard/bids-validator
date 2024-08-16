import { memoize } from '../utils/memoize.ts'

interface BIDSFileParts {
  stem: string
  suffix: string
  extension: string
  entities: Record<string, string>
}

function _readEntities(filename: string): BIDSFileParts {
  let suffix = ''
  const entities: Record<string, string> = {}

  const dot = filename.indexOf('.')
  const [stem, extension] = dot === -1
    ? [filename, '']
    : [filename.slice(0, dot), filename.slice(dot)]

  const parts = stem.split('_')
  if (parts.length > 1 || parts[parts.length - 1].match(/^[a-zA-Z0-9]+$/)) {
    suffix = parts.pop() as string
  }
  for (const part of parts) {
    // Use capturing regex to split on the first hyphen only
    const [entity, label] = part.split(/-(.+)/)
    entities[entity] = label || 'NOENTITY'
  }

  return { stem, entities, suffix, extension }
}

export const readEntities = memoize(_readEntities)

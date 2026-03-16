import { SEPARATOR_PATTERN } from '@std/path'
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

function _readDirEntities(filePath: string): Record<string, string> {
  const parts = filePath.split(SEPARATOR_PATTERN)
  const entities: Record<string, string> = {}
  parts.pop()
  for (const part of parts) {
    const [entity, label] = part.split(/-(.+)/)
    if (!entity) continue;
    entities[entity] = label || 'NOENTITY'
  }
  return entities
}
  
export const readEntities = memoize(_readEntities)
export const readDirEntities = memoize(_readDirEntities)

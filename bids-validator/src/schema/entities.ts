import { memoize } from '../utils/memoize.ts'

export interface BIDSEntities {
  suffix: string
  extension: string
  entities: Record<string, string>
}

export function _readEntities(filename: string): BIDSEntities {
  let suffix = ''
  let extension = ''
  const entities: Record<string, string> = {}

  const parts = filename.split('_')
  for (let i = 0; i < parts.length - 1; i++) {
    const [entity, label] = parts[i].split('-')
    entities[entity] = label || 'NOENTITY'
  }

  const lastPart = parts[parts.length - 1]
  const extStart = lastPart.indexOf('.')
  if (extStart === -1) {
    suffix = lastPart
  } else {
    suffix = lastPart.slice(0, extStart)
    extension = lastPart.slice(extStart)
  }

  return { suffix, extension, entities }
}

export const readEntities = memoize(_readEntities)

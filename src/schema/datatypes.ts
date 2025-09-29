import type { BIDSFile } from '../types/filetree.ts'
import type { Schema } from '../types/schema.ts'
import { memoize } from '../utils/memoize.ts'

function _modalityTable(schema: Schema): Record<string, string> {
  const modalities: Record<string, string> = {}
  const rules = (schema.rules?.modalities ?? {}) as Record<string, { datatypes: string[] }>
  for (const [modality, { datatypes }] of Object.entries(rules)) {
    for (const datatype of datatypes) {
      modalities[datatype] = modality
    }
  }
  return modalities
}

// Construct once per schema; should only be multiple in tests
export const modalityTable = memoize(_modalityTable)

export function findDatatype(
  file: BIDSFile,
  schema: Schema,
): { datatype: string; modality: string } {
  const lookup = modalityTable(schema)
  const datatype = file.parent?.name
  if (!schema?.objects?.datatypes[datatype]) {
    return { datatype: '', modality: '' }
  }
  const modality = lookup[datatype] ?? ''
  return { datatype, modality }
}

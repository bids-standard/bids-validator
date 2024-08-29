import type { GenericSchema } from '../types/schema.ts'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import type { BIDSContextDataset } from '../schema/context.ts'
import { schema as citationSchema } from '@bids/schema/citation'
import { Ajv, type DefinedError } from '@ajv'
import _addFormats from '@ajv-formats'
import { parse } from '@std/yaml'

// https://github.com/ajv-validator/ajv-formats/issues/85
const addFormats = _addFormats as unknown as typeof _addFormats.default
const citationFilename = 'CITATION.cff'

export async function citationValidate(
  schema: GenericSchema,
  dsContext: BIDSContextDataset,
) {
  const citationFile = dsContext.tree.get(citationFilename)
  if (!citationFile || 'directories' in citationFile) return
  let citation: unknown = {}
  try {
    citation = parse(await citationFile.text())
  } catch (error) {
    throw error
    return
  }
  const ajv = new Ajv()
  addFormats(ajv)
  const citationValidate = ajv.compile(citationSchema)
  if (!citationValidate(citation)) {
    for (const err of citationValidate.errors as DefinedError[]) {
      dsContext.issues.add({
        code: 'JSON_SCHEMA_VALIDATION_ERROR',
        issueMessage: err['message'],
        location: citationFilename,
      })
    }
  }
}

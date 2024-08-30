import type { GenericSchema } from '../types/schema.ts'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import type { BIDSContextDataset } from '../schema/context.ts'
import { schema as citationSchema } from '@bids/schema/citation'
import { compile } from './json.ts'
import type { DefinedError } from '@ajv'
import { parse } from '@std/yaml'

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
    dsContext.issues.add({
      code: 'FILE_READ',
      issueMessage: `Error from attempted read of file:\n${error}`,
      location: citationFilename,
    })
    return
  }
  const validate = compile(citationSchema)
  if (!validate(citation)) {
    for (const err of validate.errors as DefinedError[]) {
      dsContext.issues.add({
        code: 'CITATION_CFF_VALIDATION_ERROR',
        subCode: err['instancePath'],
        issueMessage: err['message'],
        location: citationFilename,
      })
    }
  }
}

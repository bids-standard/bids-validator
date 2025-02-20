import { Ajv, type JSONSchemaType, type ValidateFunction } from '@ajv'
import type { Schema } from '../types/schema.ts'
import { memoize } from '../utils/memoize.ts'
import { logger } from '../utils/logger.ts'

const metadataValidator = new Ajv({ strictSchema: false, logger: false })

// Bind the method to the instance before memoizing to avoid losing the context
export const compile = memoize(metadataValidator.compile.bind(metadataValidator))

export function setCustomMetadataFormats(schema: Schema): void {
  if (typeof schema.objects.formats !== 'object') {
    logger.warn(
      `schema.objects.formats missing from schema, format validation disabled.`,
    )
    return
  }
  const schemaFormats = schema.objects.formats
  for (const key of Object.keys(schemaFormats)) {
    const pattern = schemaFormats[key]['pattern']
    if (typeof pattern !== 'string') {
      logger.warn(
        `schema.objects.formats.${key} pattern missing or invalid. Skipping this format for addition to context json validator`,
      )
      continue
    }
    metadataValidator.addFormat(key, pattern)
  }
}

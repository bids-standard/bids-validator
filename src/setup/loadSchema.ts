import type { Schema } from '../types/schema.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'
import { schema as schemaDefault } from '@bids/schema'
import { setCustomMetadataFormats } from '../validators/json.ts'

/**
 * Load the schema from the specification
 */
export async function loadSchema(version?: string): Promise<Schema> {
  let schemaUrl = version
  const bidsSchema = typeof Deno !== 'undefined' ? Deno.env.get('BIDS_SCHEMA') : undefined
  if (bidsSchema !== undefined) {
    schemaUrl = bidsSchema
  } else if (version?.match(/^(v\d+\.\d+\.\d+|stable|latest)$/)) {
    schemaUrl = `https://bids-specification.readthedocs.io/en/${version}/schema.json`
  }

  let schema: Schema = new Proxy(
    schemaDefault as object,
    objectPathHandler,
  ) as Schema

  if (schemaUrl !== undefined) {
    try {
      const jsonResponse = await fetch(schemaUrl)
      const jsonData = await jsonResponse.json()
      schema = new Proxy(
        jsonData as object,
        objectPathHandler,
      ) as Schema
    } catch (error) {
      // If a custom schema URL was explicitly provided, fail rather than falling back
      console.error(error)
      throw new Error(
        `Failed to load schema from ${schemaUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
  setCustomMetadataFormats(schema)
  return schema
}

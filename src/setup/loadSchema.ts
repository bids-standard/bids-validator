import type { Schema } from '../types/schema.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'
import { schema as schemaDefault } from '@bids/schema'
import { setCustomMetadataFormats } from '../validators/json.ts'

export interface SchemaWithSource {
  schema: Schema
  source?: string
}

/**
 * Load the schema from the specification with source tracking
 *
 */
export async function loadSchemaWithSource(version?: string): Promise<SchemaWithSource> {
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
  let actualSchemaSource: string | undefined

  if (schemaUrl !== undefined) {
    try {
      const jsonResponse = await fetch(schemaUrl)
      const jsonData = await jsonResponse.json()
      schema = new Proxy(
        jsonData as object,
        objectPathHandler,
      ) as Schema
      actualSchemaSource = schemaUrl
    } catch (error) {
      // If a custom schema URL was explicitly provided, fail rather than falling back
      console.error(error)
      throw new Error(
        `Failed to load schema from ${schemaUrl}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  setCustomMetadataFormats(schema)
  return { schema, source: actualSchemaSource }
}

/**
 * Load the schema from the specification
 *
 * version is ignored when the network cannot be accessed
 */
export async function loadSchema(version?: string): Promise<Schema> {
  const result = await loadSchemaWithSource(version)
  return result.schema
}

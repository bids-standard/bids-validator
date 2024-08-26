import type { Schema } from '../types/schema.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'
import { default as schemaDefault } from '@bids/schema/schema' with { type: 'json' }
import { setCustomMetadataFormats } from '../validators/json.ts'

/**
 * Load the schema from the specification
 *
 * version is ignored when the network cannot be accessed
 */
export async function loadSchema(version = 'latest'): Promise<Schema> {
  const versionRegex = /^v\d/
  let schemaUrl = version
  const bidsSchema = typeof Deno !== 'undefined' ? Deno.env.get('BIDS_SCHEMA') : undefined
  if (bidsSchema !== undefined) {
    schemaUrl = bidsSchema
  } else if (version === 'latest' || versionRegex.test(version)) {
    schemaUrl = `https://bids-specification.readthedocs.io/en/${version}/schema.json`
  }
  let schema: Schema | undefined = undefined
  try {
    const schemaModule = await import(/* @vite-ignore */ schemaUrl, {
      with: { type: 'json' },
    })
    schema = new Proxy(
      schemaModule.default as object,
      objectPathHandler,
    ) as Schema
  } catch (error) {
    // No network access or other errors
    console.error(error)
    console.error(
      `Warning, could not load schema from ${schemaUrl}, falling back to internal version`,
    )
    schema = new Proxy(
      schemaDefault as object,
      objectPathHandler,
    ) as Schema
  }
  setCustomMetadataFormats(schema)
  return schema
}

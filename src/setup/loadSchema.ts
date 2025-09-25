import type { Schema } from '../types/schema.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'
import { schema as schemaDefault } from '@bids/schema'
import { setCustomMetadataFormats } from '../validators/json.ts'

function merge(obj1, obj2) {
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    return [...obj1, ...obj2]
  }

  let  merged = obj1
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return merged
  }
  Object.keys(obj2).map(key => {
    if (key in obj1) {
      merged[key] = merge(obj1[key], obj2[key])
    } else {
      merged[key] = obj2[key]
    }
  })
  return merged
}

/**
 * Load the schema from the specification
 */
export async function loadSchema(version?: string, patch?: string, print?: boolean): Promise<Schema> {
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

  if (patch) {
    let patchText = await Deno.readTextFile(patch);
    let patchJson = JSON.parse(patchText)
    schema = merge(schema, patchJson)
  }

  if (print) {
    console.log(JSON.stringify(schema))
    Deno.exit(0)
  }
  setCustomMetadataFormats(schema)
  return schema
}

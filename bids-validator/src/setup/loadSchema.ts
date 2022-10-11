import { Schema } from '../types/schema.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'
import * as schemaDefault from 'https://bids-specification.readthedocs.io/en/latest/schema.json' assert { type: 'json' }

/**
 * Load the schema from the specification
 *
 * version is ignored when the network cannot be accessed
 */
export async function loadSchema(version = 'latest'): Promise<Schema> {
  const schemaUrl = `https://bids-specification.readthedocs.io/en/${version}/schema.json`
  try {
    const schemaModule = await import(schemaUrl, {
      assert: { type: 'json' },
    })
    return new Proxy(schemaModule.default as Schema, objectPathHandler)
  } catch {
    // No network access or other errors
    console.error(
      `Warning, could not load schema from ${schemaUrl}, falling back to internal version`,
    )
    return new Proxy(schemaModule as Schema, objectPathHandler)
  }
}

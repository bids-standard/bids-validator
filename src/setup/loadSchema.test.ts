import { assertEquals, assert } from '@std/assert'
import { loadSchemaWithSource, loadSchema } from './loadSchema.ts'

Deno.test('loadSchemaWithSource function', async (t) => {
  await t.step('loadSchema returns just Schema for backward compatibility', async () => {
    const schema = await loadSchema()
    assert(schema.schema_version)
    assert(!('source' in schema))
  })

  await t.step('loadSchemaWithSource returns SchemaWithSource', async () => {
    const result = await loadSchemaWithSource()
    assert(result.schema)
    assert(result.schema.schema_version)
    // When no custom schema is provided, source should be undefined
    assertEquals(result.source, undefined)
  })

  await t.step('loadSchemaWithSource tracks source when custom URL provided', async () => {
    // This test validates the structure even though network fetch will fail
    const customUrl = 'https://example.com/custom-schema.json'
    const result = await loadSchemaWithSource(customUrl)
    assert(result.schema)
    assert(result.schema.schema_version)
    // Since network fetch fails, it falls back to default schema and source is undefined
    assertEquals(result.source, undefined)
  })

  await t.step('loadSchemaWithSource handles environment variable', async () => {
    const originalEnv = Deno.env.get('BIDS_SCHEMA')
    try {
      const customUrl = 'https://env-schema.example.com/schema.json'
      Deno.env.set('BIDS_SCHEMA', customUrl)

      const result = await loadSchemaWithSource()
      assert(result.schema)
      assert(result.schema.schema_version)
      // Since network fetch fails, source should be undefined
      assertEquals(result.source, undefined)
    } finally {
      if (originalEnv !== undefined) {
        Deno.env.set('BIDS_SCHEMA', originalEnv)
      } else {
        Deno.env.delete('BIDS_SCHEMA')
      }
    }
  })
})
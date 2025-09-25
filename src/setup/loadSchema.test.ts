import { assertEquals, assert, assertRejects } from '@std/assert'
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

  await t.step('loadSchemaWithSource throws error when custom URL fails without network', async () => {
    // Check if network permission is granted
    const netPermission = await Deno.permissions.query({ name: 'net' })

    if (netPermission.state !== 'granted') {
      // Without network permission, it should throw an error
      const customUrl = 'https://example.com/custom-schema.json'
      await assertRejects(
        async () => await loadSchemaWithSource(customUrl),
        Error,
        'Failed to load schema from https://example.com/custom-schema.json'
      )
    } else {
      // With network permission, test might behave differently
      // Skip this specific test when network is available
      console.log('Skipping test - network permission granted')
    }
  })

  await t.step('loadSchemaWithSource with environment variable throws without network', async () => {
    // Check if network permission is granted
    const netPermission = await Deno.permissions.query({ name: 'net' })

    const originalEnv = Deno.env.get('BIDS_SCHEMA')
    try {
      const customUrl = 'https://env-schema.example.com/schema.json'
      Deno.env.set('BIDS_SCHEMA', customUrl)

      if (netPermission.state !== 'granted') {
        // Without network permission, it should throw
        await assertRejects(
          async () => await loadSchemaWithSource(),
          Error,
          'Failed to load schema from https://env-schema.example.com/schema.json'
        )
      } else {
        // With network, might still fail but for different reasons (404, etc)
        try {
          const result = await loadSchemaWithSource()
          // If it succeeds, check the result
          assert(result.schema)
          assert(result.schema.schema_version)
        } catch (error) {
          // Expected to fail with unreachable URL
          assert(error instanceof Error)
          assert(error.message.includes('Failed to load schema'))
        }
      }
    } finally {
      if (originalEnv !== undefined) {
        Deno.env.set('BIDS_SCHEMA', originalEnv)
      } else {
        Deno.env.delete('BIDS_SCHEMA')
      }
    }
  })
})
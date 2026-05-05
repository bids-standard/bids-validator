import { assert } from '@std/assert'
import type { GenericRule, GenericSchema } from '../types/schema.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { pruneSchema, type SchemaFilter } from './pruneSchema.ts'

Deno.test('Test schema pruning', async (t) => {
  const schema = await loadSchema() as unknown as GenericSchema
  await t.step('Test delete path', async () => {
    const path = 'rules.sidecars'
    const filter: SchemaFilter = {path}
    assert(schema[path])
    const newSchema = pruneSchema(schema, [filter])
    assert(newSchema[path] == undefined)
  })
})

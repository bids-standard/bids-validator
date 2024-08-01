import { assert } from '../deps/asserts.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { nonSchemaIssues } from './list.ts'
import { GenericSchema } from '../types/schema.ts'

function extractCodes(
  schema: GenericSchema,
  rootSchema?: GenericSchema,
  schemaPath?: string,
): string[] {
  if (!rootSchema) {
    rootSchema = schema
  }
  if (!schemaPath) {
    schemaPath = 'schema.rules'
  }
  let codes = []
  for (const key in schema) {
    if (!(schema[key].constructor === Object)) {
      continue
    }
    if (schema[key].constructor === Object) {
      codes.push(...extractCodes(
        schema[key] as GenericSchema,
        rootSchema,
        `${schemaPath}.${key}`,
      ))
    }
    if ('code' in schema[key] && typeof schema[key]['code'] === 'string') {
      codes.push(schema[key]['code'])
    }
  }
  return codes
}

Deno.test('Cross reference error codes in schema and in list.ts', async (t) => {
  let codes = [] as string[]
  await t.step('load schema, extract codes', async () => {
    const schema = await loadSchema()
    codes = extractCodes(schema as unknown as GenericSchema)
    assert(codes.length > 1)
  })

  await t.step('wat', (t) => {
    const duplicates = codes.filter((x) => Object.hasOwn(nonSchemaIssues, x))
    assert(duplicates.length === 0, `Found duplicates ${duplicates}`)
  })
})

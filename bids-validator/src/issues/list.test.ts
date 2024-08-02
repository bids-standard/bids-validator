import { assert, assertEquals } from '../deps/asserts.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { bidsIssues } from './list.ts'
import { GenericSchema } from '../types/schema.ts'

interface schemaError {
  code: string
  level?: string
}

function getSchemaErrors(
  schema: GenericSchema,
  rootSchema: GenericSchema,
  schemaPath: string,
): schemaError[] {
  let errors = []
  for (const key in schema) {
    if (!(schema[key].constructor === Object)) {
      continue
    }
    if (schema[key].constructor === Object) {
      errors.push(...getSchemaErrors(
        schema[key] as GenericSchema,
        rootSchema,
        `${schemaPath}.${key}`,
      ))
    }
    let schemaEntry = schema[key] as object
    if ('code' in schemaEntry && typeof schemaEntry['code'] === 'string') {
      errors.push(schema[key])
    }
  }
  return errors as schemaError[]
}

Deno.test('Cross reference error codes in schema and in list.ts', async (t) => {
  let errors: schemaError[] = []  
  await t.step('load schema, get errors', async () => {
    const rules = await loadSchema().then((schema) => schema['rules']) as GenericSchema
    errors = getSchemaErrors(rules, rules, 'rules')
    assert(errors.length > 1)
  })

  await t.step('wat', (t) => {
    errors.map((error) => {
      const code = error['code']
      if (!Object.hasOwn(bidsIssues, code)) {
        return
      }
      if (Object.hasOwn(error, 'level')) {
        assertEquals(
          bidsIssues[code]['severity'],
          error['level'],
          `Severity mismatch on code ${code}`,
        )
      }
    })
  })
})

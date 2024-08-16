import { assert, assertEquals } from '@std/assert'
import { loadSchema } from '../setup/loadSchema.ts'
import { bidsIssues } from './list.ts'
import type { GenericSchema } from '../types/schema.ts'

interface schemaError {
  code: string
  level?: string
}

function getSchemaErrors(
  schema: GenericSchema,
  rootSchema: GenericSchema,
  schemaPath: string,
): schemaError[] {
  const errors: schemaError[] = []
  for (const [key, value] of Object.entries(schema)) {
    if (value.constructor !== Object) {
      continue
    }
    errors.push(...getSchemaErrors(
      value as GenericSchema,
      rootSchema,
      `${schemaPath}.${key}`,
    ))
    if ('code' in value && typeof value.code === 'string') {
      errors.push(value as unknown as schemaError)
    }
  }
  return errors
}

Deno.test('Cross reference error codes in schema and in list.ts', async (t) => {
  let errors: schemaError[] = []
  await t.step('load schema, get errors', async () => {
    const rules = await loadSchema().then((schema) => schema['rules']) as GenericSchema
    errors = getSchemaErrors(rules, rules, 'rules')
    assert(errors.length > 1)
  })

  for (const error of errors) {
    const code = error.code
    await t.step(`check ${code}`, () => {
      if (Object.hasOwn(bidsIssues, code) && Object.hasOwn(error, 'level')) {
        assertEquals(
          bidsIssues[code]['severity'],
          error['level'],
          `Severity mismatch on code ${code}`,
        )
      }
    })
  }
})

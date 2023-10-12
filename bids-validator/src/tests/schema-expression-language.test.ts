import { loadSchema } from '../setup/loadSchema.ts'
import { Table } from '../deps/cliffy.ts'
import { colors } from '../deps/fmt.ts'
import { BIDSContext } from '../schema/context.ts'
import { assert, assertEquals } from '../deps/asserts.ts'
import { evalCheck } from '../schema/applyRules.ts'
import { expressionFunctions } from '../schema/expressionLanguage.ts'

const schema = await loadSchema()
const pretty_null = (x: string | null): string => (x === null ? 'null' : x)

const equal = <T>(a: T, b: T): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, idx) => val === b[idx])
  }
  return a === b
}

Deno.test('validate schema expression tests', async (t) => {
  const results: string[][] = []
  const header = ['expression', 'desired', 'actual', 'result'].map((x) =>
    colors.magenta(x),
  )
  for (const test of schema.meta.expression_tests) {
    await t.step(`${test.expression} evals to ${test.result}`, () => {
      // @ts-expect-error
      const context = expressionFunctions as BIDSContext
      const actual_result = evalCheck(test.expression, context)
      if (equal(actual_result, test.result)) {
        results.push([
          colors.cyan(test.expression),
          pretty_null(test.result),
          pretty_null(actual_result),
          colors.green('pass'),
        ])
      } else {
        results.push([
          colors.cyan(test.expression),
          pretty_null(test.result),
          pretty_null(actual_result),
          colors.red('fail'),
        ])
      }
      assertEquals(actual_result, test.result)
    })
  }
  results.sort((a, b) => {
    return a[3].localeCompare(b[3])
  })
  const table = new Table()
    .header(header)
    .border(false)
    .body(results)
    .padding(1)
    .indent(2)
    .maxColWidth(40)
    .toString()
  console.log(table)
})

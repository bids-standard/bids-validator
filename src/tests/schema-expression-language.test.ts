import { loadSchema } from '../setup/loadSchema.ts'
import { Table } from '@cliffy/table'
import * as colors from '@std/fmt/colors'
import type { BIDSContext } from '../schema/context.ts'
import { type assert, assertEquals } from '@std/assert'
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
  const header = ['expression', 'desired', 'actual', 'result'].map((x) => colors.magenta(x))
  const xfails = ['intersects([1], [1, 2])']
  for (const test of schema.meta.expression_tests) {
    await t.step(`${test.expression} evals to ${test.result}`, () => {
      const context = { file: { parent: null }, dataset: { tree: null } } as unknown as BIDSContext
      Object.assign(context, expressionFunctions)
      // @ts-expect-error
      context.exists.bind(context)
      const actual_result = evalCheck(test.expression, context)
      if (equal(actual_result, test.result)) {
        results.push([
          colors.cyan(test.expression),
          pretty_null(test.result),
          pretty_null(actual_result),
          colors.green('pass'),
        ])
      } else if (xfails.includes(test.expression)) {
        results.push([
          colors.cyan(test.expression),
          pretty_null(test.result),
          pretty_null(actual_result),
          colors.yellow('xfail'),
        ])
      } else {
        results.push([
          colors.cyan(test.expression),
          pretty_null(test.result),
          pretty_null(actual_result),
          colors.red('fail'),
        ])
      }
      // Don't fail on xfail
      if (!xfails.includes(test.expression)) {
        assertEquals(actual_result, test.result)
      }
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

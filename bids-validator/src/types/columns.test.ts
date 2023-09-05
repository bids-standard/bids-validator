import { assertEquals } from '../deps/asserts.ts'
import { ColumnsMap } from './columns.ts'

Deno.test('ColumnsMap', async (t) => {
  await t.step('get is accessible with square bracket notation', () => {
    const columns = new ColumnsMap()
    columns['a'] = ['0']
    assertEquals(columns['a'], ['0'])
  })
  await t.step('preserves insertion order with property access', () => {
    const columns = new ColumnsMap()
    columns['a'] = ['0']
    columns[2] = ['1']
    columns[1] = ['2']
    columns['b'] = ['3']

    // Check that the order is still correct with iteration
    let iteration = 0
    for (const [_, val] of columns) {
      assertEquals(val, [iteration.toString()])
      iteration += 1
    }
    assertEquals(columns.a, ['0'])
  })
  await t.step('keys are accessible with Object.keys', () => {
    const columns = new ColumnsMap()
    columns['a'] = ['0']
    columns['b'] = ['1']
    columns[0] = ['2']
    assertEquals(Object.keys(columns), ['a', 'b', '0'])
    assertEquals(Object.getOwnPropertyNames(columns), ['a', 'b', '0'])
  })
})

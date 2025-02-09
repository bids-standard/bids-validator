import { assertEquals } from '@std/assert'
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
  await t.step('size columns are permissible', () => {
    const columns = new ColumnsMap()
    // @ts-expect-error ts thinks size is protected property
    columns['size'] = ['0']
    // @ts-expect-error ibid
    assertEquals(columns.size, ['0'])
  })
  await t.step('set columns are permissible', () => {
    const columns = new ColumnsMap()
    // @ts-expect-error ts thinks size is protected property
    columns['set'] = ['0']
    // @ts-expect-error ibid
    assertEquals(columns.set, ['0'])
  })
  await t.step('missing columns are undefined', () => {
    const columns = new ColumnsMap()
    columns['a'] = ['0']
    assertEquals(columns.b, undefined)
    assertEquals(columns.size, undefined)
  })
})

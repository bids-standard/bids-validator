import { assertEquals } from '../deps/asserts.ts'
import { parseOptions } from './options.ts'

Deno.test('options parsing', async (t) => {
  await t.step('verify basic arguments work', async () => {
    const options = await parseOptions(['my_dataset', '--json'])
    assertEquals(options, {
      datasetPath: 'my_dataset',
      debug: 'ERROR',
      json: true,
      schema: 'latest',
    })
  })
})

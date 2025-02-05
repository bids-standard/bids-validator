import { assertEquals } from '@std/assert'
import { parseOptions } from './options.ts'

Deno.test('options parsing', async (t) => {
  await t.step('verify basic arguments work', async () => {
    const options = await parseOptions(['my_dataset', '--json'])
    assertEquals(options, {
      datasetPath: 'my_dataset',
      debug: 'ERROR',
      json: true,
      color: false,
      blacklistModalities: [],
      maxRows: 1000,
    })
  })
})

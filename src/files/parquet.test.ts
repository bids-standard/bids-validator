import { assertEquals } from '@std/assert'
import { FileIgnoreRules } from './ignore.ts'
import { BIDSFileDeno } from './deno.ts'

import { loadParquet } from './parquet.ts'

Deno.test('Test loading parquet file', async (t) => {
  const ignore = new FileIgnoreRules([])
  await t.step('Load participants.parquet', async () => {
    const path = 'participants.parquet'
    const root = './tests/data/'
    const file = new BIDSFileDeno(root, path, ignore)
    const participantsMap = await loadParquet(file)
    const keys = Object.keys(participantsMap)
    assertEquals(keys.length, 3)
    keys.map(key => assertEquals(participantsMap.get(key)?.length, 16))
  })
})

import { assert, assertEquals, assertObjectMatch } from '@std/assert'
import { pathToFile } from './filetree.ts'
import { loadTSV } from './tsv.ts'
import { streamFromString } from '../tests/utils.ts'
import { ColumnsMap } from '../types/columns.ts'

Deno.test('TSV loading', async (t) => {
  await t.step('Empty file produces empty map', async () => {
    const file = pathToFile('/empty.tsv')
    file.stream = streamFromString('')

    const map = await loadTSV(file)
    // map.size looks for a column called map, so work around it
    assertEquals(Object.keys(map).length, 0)
  })

  await t.step('Single row file produces header-only map', async () => {
    const file = pathToFile('/single_row.tsv')
    file.stream = streamFromString('a\tb\tc\n')

    const map = await loadTSV(file)
    assertEquals(map.a, [])
    assertEquals(map.b, [])
    assertEquals(map.c, [])
  })

  await t.step('Single column file produces single column map', async () => {
    const file = pathToFile('/single_column.tsv')
    file.stream = streamFromString('a\n1\n2\n3\n')

    const map = await loadTSV(file)
    assertEquals(map.a, ['1', '2', '3'])
  })

  await t.step('Missing final newline is ignored', async () => {
    const file = pathToFile('/missing_newline.tsv')
    file.stream = streamFromString('a\n1\n2\n3')

    const map = await loadTSV(file)
    assertEquals(map.a, ['1', '2', '3'])
  })

  await t.step('Empty row throws issue', async () => {
    const file = pathToFile('/empty_row.tsv')
    file.stream = streamFromString('a\tb\tc\n1\t2\t3\n\n4\t5\t6\n')

    try {
      await loadTSV(file)
    } catch (e: any) {
      assertObjectMatch(e, { key: 'TSV_EMPTY_LINE', line: 3 })
    }
  })

  await t.step('Mismatched row length throws issue', async () => {
    const file = pathToFile('/mismatched_row.tsv')
    file.stream = streamFromString('a\tb\tc\n1\t2\t3\n4\t5\n')

    try {
      await loadTSV(file)
    } catch (e: any) {
      assertObjectMatch(e, { key: 'TSV_EQUAL_ROWS', line: 3 })
    }
  })

  // Tests will have populated the memoization cache
  await loadTSV.cache.clear()
})

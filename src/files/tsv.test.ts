import {
  assert,
  assertEquals,
  assertNotStrictEquals,
  assertObjectMatch,
  assertStrictEquals,
} from '@std/assert'
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

  await t.step('maxRows limits the number of rows read', async () => {
    const file = pathToFile('/long.tsv')
    // Use 1500 to avoid overlap with default initial capacity
    const text = 'a\tb\tc\n' + '1\t2\t3\n'.repeat(1500)
    file.stream = streamFromString(text)

    let map = await loadTSV(file, 0)
    assertEquals(map.a, [])
    assertEquals(map.b, [])
    assertEquals(map.c, [])

    // Do not assume that caching respects maxRows in this test
    loadTSV.cache.clear()
    file.stream = streamFromString(text)
    map = await loadTSV(file, 1)
    assertEquals(map.a, ['1'])
    assertEquals(map.b, ['2'])
    assertEquals(map.c, ['3'])

    loadTSV.cache.clear()
    file.stream = streamFromString(text)
    map = await loadTSV(file, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    loadTSV.cache.clear()
    file.stream = streamFromString(text)
    map = await loadTSV(file, -1)
    assertEquals(map.a, Array(1500).fill('1'))
    assertEquals(map.b, Array(1500).fill('2'))
    assertEquals(map.c, Array(1500).fill('3'))

    loadTSV.cache.clear()
    // Check that maxRows does not truncate shorter files
    file.stream = streamFromString('a\tb\tc\n1\t2\t3\n4\t5\t6\n7\t8\t9\n')
    map = await loadTSV(file, 4)
    assertEquals(map.a, ['1', '4', '7'])
    assertEquals(map.b, ['2', '5', '8'])
    assertEquals(map.c, ['3', '6', '9'])
  })

  await t.step('caching avoids multiple reads', async () => {
    loadTSV.cache.clear()
    const file = pathToFile('/long.tsv')
    // Use 1500 to avoid overlap with default initial capacity
    const text = 'a\tb\tc\n' + '1\t2\t3\n'.repeat(1500)
    file.stream = streamFromString(text)

    let map = await loadTSV(file, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    // Replace stream to ensure cache does not depend on deep object equality
    file.stream = streamFromString(text)
    let repeatMap = await loadTSV(file, 2)
    assertStrictEquals(map, repeatMap)

    loadTSV.cache.clear()
    // DO NOT replace stream so the next read verifies the previous stream wasn't read
    repeatMap = await loadTSV(file, 2)
    assertEquals(repeatMap.a, ['1', '1'])
    assertEquals(repeatMap.b, ['2', '2'])
    assertEquals(repeatMap.c, ['3', '3'])
    // Same contents, different objects
    assertNotStrictEquals(map, repeatMap)
  })

  await t.step('caching is keyed on maxRows', async () => {
    const file = pathToFile('/long.tsv')
    // Use 1500 to avoid overlap with default initial capacity
    const text = 'a\tb\tc\n' + '1\t2\t3\n'.repeat(1500)
    file.stream = streamFromString(text)

    let map = await loadTSV(file, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    file.stream = streamFromString(text)
    let repeatMap = await loadTSV(file, 3)
    assertNotStrictEquals(map, repeatMap)
    assertEquals(repeatMap.a, ['1', '1', '1'])
    assertEquals(repeatMap.b, ['2', '2', '2'])
    assertEquals(repeatMap.c, ['3', '3', '3'])

    file.stream = streamFromString(text)
    repeatMap = await loadTSV(file, 2)
    assertStrictEquals(map, repeatMap)
    assertEquals(repeatMap.a, ['1', '1'])
    assertEquals(repeatMap.b, ['2', '2'])
    assertEquals(repeatMap.c, ['3', '3'])
  })

  await t.step('Raises issue on duplicate header', async () => {
    const file = pathToFile('/duplicate_header.tsv')
    file.stream = streamFromString('a\ta\n1\t2\n')

    try {
      await loadTSV(file)
      assert(false, 'Expected error')
    } catch (e: any) {
      assertObjectMatch(e, { key: 'TSV_COLUMN_HEADER_DUPLICATE', evidence: 'a, a' })
    }
  })

  // Tests will have populated the memoization cache
  loadTSV.cache.clear()
})

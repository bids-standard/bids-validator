import {
  assert,
  assertEquals,
  assertNotStrictEquals,
  assertObjectMatch,
  assertStrictEquals,
} from '@std/assert'
import { pathToFile } from './filetree.test.ts'
import { BIDSFileDeno } from './deno.ts'
import { loadHeaderlessTSV, loadTSV } from './tsv.ts'
import { testAsyncFileAccess } from './access.test.ts'
import { CompressedStringOpener, StreamOpener, StringOpener } from './openers.test.ts'

Deno.test('TSV loading', async (t) => {
  await t.step('Empty file produces empty map', async () => {
    const file = pathToFile('/empty.tsv')
    file.opener = new StringOpener('')

    const map = await loadTSV(file)
    // map.size looks for a column called map, so work around it
    assertEquals(Object.keys(map).length, 0)
  })

  await t.step('Single row file produces header-only map', async () => {
    const file = pathToFile('/single_row.tsv')
    file.opener = new StringOpener('a\tb\tc\n')

    const map = await loadTSV(file)
    assertEquals(map.a, [])
    assertEquals(map.b, [])
    assertEquals(map.c, [])
  })

  await t.step('Single column file produces single column map', async () => {
    const file = pathToFile('/single_column.tsv')
    file.opener = new StringOpener('a\n1\n2\n3\n')

    const map = await loadTSV(file)
    assertEquals(map.a, ['1', '2', '3'])
  })

  await t.step('Missing final newline is ignored', async () => {
    const file = pathToFile('/missing_newline.tsv')
    file.opener = new StringOpener('a\n1\n2\n3')

    const map = await loadTSV(file)
    assertEquals(map.a, ['1', '2', '3'])
  })

  await t.step('Empty row throws issue', async () => {
    const file = pathToFile('/empty_row.tsv')
    file.opener = new StringOpener('a\tb\tc\n1\t2\t3\n\n4\t5\t6\n')

    try {
      await loadTSV(file)
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'TSV_EMPTY_LINE', line: 3 })
    }
  })

  await t.step('Mismatched row length throws issue', async () => {
    const file = pathToFile('/mismatched_row.tsv')
    file.opener = new StringOpener('a\tb\tc\n1\t2\t3\n4\t5\n')

    try {
      await loadTSV(file)
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'TSV_EQUAL_ROWS', line: 3 })
    }
  })

  await t.step('maxRows limits the number of rows read', async () => {
    const file = pathToFile('/long.tsv')
    // Use 1500 to avoid overlap with default initial capacity
    const text = 'a\tb\tc\n' + '1\t2\t3\n'.repeat(1500)
    file.opener = new StringOpener(text)

    let map = await loadTSV(file, 0)
    assertEquals(map.a, [])
    assertEquals(map.b, [])
    assertEquals(map.c, [])

    // Do not assume that caching respects maxRows in this test
    loadTSV.cache.clear()
    map = await loadTSV(file, 1)
    assertEquals(map.a, ['1'])
    assertEquals(map.b, ['2'])
    assertEquals(map.c, ['3'])

    loadTSV.cache.clear()
    map = await loadTSV(file, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    loadTSV.cache.clear()
    map = await loadTSV(file, -1)
    assertEquals(map.a, Array(1500).fill('1'))
    assertEquals(map.b, Array(1500).fill('2'))
    assertEquals(map.c, Array(1500).fill('3'))

    loadTSV.cache.clear()
    // Check that maxRows does not truncate shorter files
    file.opener = new StringOpener('a\tb\tc\n1\t2\t3\n4\t5\t6\n7\t8\t9\n')
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
    file.opener = new StringOpener(text)

    const map = await loadTSV(file, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    // Replace stream to ensure cache does not depend on deep object equality
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
    file.opener = new StringOpener(text)

    const map = await loadTSV(file, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    let repeatMap = await loadTSV(file, 3)
    assertNotStrictEquals(map, repeatMap)
    assertEquals(repeatMap.a, ['1', '1', '1'])
    assertEquals(repeatMap.b, ['2', '2', '2'])
    assertEquals(repeatMap.c, ['3', '3', '3'])

    repeatMap = await loadTSV(file, 2)
    assertStrictEquals(map, repeatMap)
    assertEquals(repeatMap.a, ['1', '1'])
    assertEquals(repeatMap.b, ['2', '2'])
    assertEquals(repeatMap.c, ['3', '3'])
  })

  await t.step('Raises issue on duplicate header', async () => {
    const file = pathToFile('/duplicate_header.tsv')
    file.opener = new StringOpener('a\ta\n1\t2\n')

    try {
      await loadTSV(file)
      assert(false, 'Expected error')
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, {
        code: 'TSV_COLUMN_HEADER_DUPLICATE',
        issueMessage: 'a, a',
      })
    }
  })

  await t.step('Raises issue on non utf-8', async () => {
    const file = new BIDSFileDeno('', './tests/data/iso8859.tsv')

    try {
      await loadTSV(file)
      assert(false, 'Expected error')
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'INVALID_FILE_ENCODING' })
    }
  })

  // Tests will have populated the memoization cache
  loadTSV.cache.clear()
})

Deno.test('Headerless TSV loading (compressed)', async (t) => {
  await t.step('No header and empty file produces empty map', async () => {
    const file = pathToFile('/empty.tsv.gz')
    file.opener = new CompressedStringOpener('')

    const map = await loadHeaderlessTSV(file, [], true)
    // map.size looks for a column called map, so work around it
    assertEquals(Object.keys(map).length, 0)
  })

  await t.step('Empty file produces header-only map', async () => {
    const file = pathToFile('/empty.tsv.gz')
    file.opener = new CompressedStringOpener('')

    const map = await loadHeaderlessTSV(file, ['a', 'b', 'c'], true)
    assertEquals(map.a, [])
    assertEquals(map.b, [])
    assertEquals(map.c, [])
  })

  await t.step('Single column file produces single column maps', async () => {
    const file = pathToFile('/single_column.tsv')
    file.opener = new CompressedStringOpener('1\n2\n3\n')

    const map = await loadHeaderlessTSV(file, ['a'], true)
    assertEquals(map.a, ['1', '2', '3'])
  })

  await t.step('Mismatched header length throws issue', async () => {
    const file = pathToFile('/single_column.tsv.gz')
    file.opener = new CompressedStringOpener('1\n2\n3\n')

    try {
      await loadHeaderlessTSV(file, ['a', 'b'], true)
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'TSV_EQUAL_ROWS', line: 1 })
    }
  })

  await t.step('Missing final newline is ignored', async () => {
    const file = pathToFile('/missing_newline.tsv.gz')
    file.opener = new CompressedStringOpener('1\n2\n3')

    const map = await loadHeaderlessTSV(file, ['a'], true)
    assertEquals(map.a, ['1', '2', '3'])
  })

  await t.step('Empty row throws issue', async () => {
    const file = pathToFile('/empty_row.tsv.gz')
    file.opener = new CompressedStringOpener('1\t2\t3\n\n4\t5\t6\n')

    try {
      await loadHeaderlessTSV(file, ['a', 'b', 'c'], true)
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'TSV_EMPTY_LINE', line: 2 })
    }
  })

  await t.step('Mislabeled TSV throws issue', async () => {
    const file = pathToFile('/mismatched_row.tsv.gz')
    file.opener = new StringOpener('a\tb\tc\n1\t2\t3\n4\t5\n')

    try {
      await loadHeaderlessTSV(file, ['a', 'b', 'c'], true)
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'INVALID_GZIP' })
    }
  })

  await t.step('maxRows limits the number of rows read', async () => {
    const file = pathToFile('/long.tsv.gz')
    // Use 1500 to avoid overlap with default initial capacity
    const headers = ['a', 'b', 'c']
    const text = '1\t2\t3\n'.repeat(1500)
    file.opener = new CompressedStringOpener(text)

    let map = await loadHeaderlessTSV(file, headers, true, 0)
    assertEquals(map.a, [])
    assertEquals(map.b, [])
    assertEquals(map.c, [])

    map = await loadHeaderlessTSV(file, headers, true, 1)
    assertEquals(map.a, ['1'])
    assertEquals(map.b, ['2'])
    assertEquals(map.c, ['3'])

    map = await loadHeaderlessTSV(file, headers, true, 2)
    assertEquals(map.a, ['1', '1'])
    assertEquals(map.b, ['2', '2'])
    assertEquals(map.c, ['3', '3'])

    map = await loadHeaderlessTSV(file, headers, true, -1)
    assertEquals(map.a, Array(1500).fill('1'))
    assertEquals(map.b, Array(1500).fill('2'))
    assertEquals(map.c, Array(1500).fill('3'))

    // Check that maxRows does not truncate shorter files
    file.opener = new CompressedStringOpener('1\t2\t3\n4\t5\t6\n7\t8\t9\n')
    map = await loadHeaderlessTSV(file, headers, true, 4)
    assertEquals(map.a, ['1', '4', '7'])
    assertEquals(map.b, ['2', '5', '8'])
    assertEquals(map.c, ['3', '6', '9'])
  })
})

Deno.test('Headerless TSV loading (uncompressed)', async (t) => {
  await t.step('First row is loaded as data, not headers', async () => {
    const file = pathToFile('/sub-01/motion/sub-01_task-walk_motion.tsv')
    file.opener = new StringOpener('NaN\t0.0\t-1.0\n0.1\t0.2\t0.3\n')

    const map = await loadHeaderlessTSV(file, ['a', 'b', 'c'], false)
    assertEquals(map.a, ['NaN', '0.1'])
    assertEquals(map.b, ['0.0', '0.2'])
    assertEquals(map.c, ['-1.0', '0.3'])
  })

  await t.step('Duplicate values in first row do not raise duplicate header issue', async () => {
    const file = pathToFile('/sub-01/motion/sub-01_task-walk_motion.tsv')
    file.opener = new StringOpener('0\t0\t0\n1\t2\t3\n')

    const map = await loadHeaderlessTSV(file, ['a', 'b', 'c'], false)
    assertEquals(map.a, ['0', '1'])
    assertEquals(map.b, ['0', '2'])
    assertEquals(map.c, ['0', '3'])
  })

  await t.step('Mismatched header length throws TSV_EQUAL_ROWS, not INVALID_GZIP', async () => {
    const file = pathToFile('/sub-01/motion/sub-01_task-walk_motion.tsv')
    file.opener = new StringOpener('1\n2\n3\n')

    try {
      await loadHeaderlessTSV(file, ['a', 'b'], false)
      assert(false, 'Expected error')
    } catch (e: unknown) {
      assertObjectMatch(e as Record<PropertyKey, unknown>, { code: 'TSV_EQUAL_ROWS', line: 1 })
    }
  })

  await t.step('maxRows limits the number of rows read', async () => {
    const file = pathToFile('/sub-01/motion/sub-01_task-walk_motion.tsv')
    file.opener = new StringOpener('1\t2\n3\t4\n5\t6\n')

    const map = await loadHeaderlessTSV(file, ['a', 'b'], false, 2)
    assertEquals(map.a, ['1', '3'])
    assertEquals(map.b, ['2', '4'])
  })

  await t.step('Stream errors rethrow the raw error', async () => {
    const file = pathToFile('/sub-01/motion/sub-01_task-walk_motion.tsv')
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
      start(controller) {
        controller.error(new Error('stream error'))
      },
    })
    file.opener = new StreamOpener(stream, 1)

    try {
      await loadHeaderlessTSV(file, ['a'], false)
      assert(false, 'Expected error')
    } catch (e: unknown) {
      assert(e instanceof Error)
      assertEquals(e.message, 'stream error')
    }
  })
})

testAsyncFileAccess('Test file access errors for loadTSV', loadTSV)

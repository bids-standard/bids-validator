import { assert, assertArrayIncludes, assertObjectMatch } from '@std/assert'
import { parseRmetLine } from './repo.ts'

Deno.test('parseRmetLine', async (t) => {
  await t.step('parses valid rmet line', () => {
    const line =
      '1590213748.042921433s 57894849-d0c8-4c62-8418-3627be18a196:V +iVcEk18e3J2WQys4zr_ANaTPfpUufW4Y#ds002778/dataset_description.json'
    const entry = parseRmetLine(line)
    assertObjectMatch(entry!, {
      timestamp: 1590213748.042921433,
      uuid: '57894849-d0c8-4c62-8418-3627be18a196',
      version: 'iVcEk18e3J2WQys4zr_ANaTPfpUufW4Y',
      path: 'ds002778/dataset_description.json',
    })
  })
  await t.step('parses base64-encoded rmet line', () => {
    const line =
      '1590213748.042921433s 57894849-d0c8-4c62-8418-3627be18a196:V +!aVZjRWsxOGUzSjJXUXlzNHpyX0FOYVRQZnBVdWZXNFkjZHMwMDI3NzgvZGF0YXNldF9kZXNjcmlwdGlvbi5qc29u'
    const entry = parseRmetLine(line)
    assertObjectMatch(entry!, {
      timestamp: 1590213748.042921433,
      uuid: '57894849-d0c8-4c62-8418-3627be18a196',
      version: 'iVcEk18e3J2WQys4zr_ANaTPfpUufW4Y',
      path: 'ds002778/dataset_description.json',
    })
  })
})

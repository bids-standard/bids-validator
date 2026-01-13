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
    // Real example from OpenNeuro, has a unicode apostrophe in the filename
    const line =
      '1714730995.499196097s 51d08fb4-c58a-4fd7-a171-e5ff8226ca2f:V +!aG1NM2VqYWRxdFgxR18uc1VRNmJzd0FMLnhUcFJFeG8jZHMwMDQxOTQvZGVyaXZhdGl2ZXMvQnJhbmRzZXRhbDIwMjRUZW1wb3JhbEFkYXB0YXRpb25FQ29HL2RhdGFfc3ViamVjdHMvc3ViLXAxMS9lcG9jaHNfYi9lcG9jaHNfYl9jaGFubmVsMzItQW1iZXLigJlzIE1hY0Jvb2sgUHJvLnR4dA=='
    const entry = parseRmetLine(line)
    assertObjectMatch(entry!, {
      timestamp: 1714730995.499196097,
      uuid: '51d08fb4-c58a-4fd7-a171-e5ff8226ca2f',
      version: 'hmM3ejadqtX1G_.sUQ6bswAL.xTpRExo',
      path:
        'ds004194/derivatives/Brandsetal2024TemporalAdaptationECoG/data_subjects/sub-p11/epochs_b/epochs_b_channel32-Amber’s MacBook Pro.txt',
    })
  })
})

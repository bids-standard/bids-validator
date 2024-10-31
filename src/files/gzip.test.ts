import { assert, assertObjectMatch } from '@std/assert'
import { parseGzip } from './gzip.ts'
import { BIDSFileDeno } from './deno.ts'

Deno.test('parseGzip', async (t) => {
  await t.step('parses anonymized file', async () => {
    const file = new BIDSFileDeno('tests/data/gzip', 'anon.gz')
    const gzip = await parseGzip(file)
    assert(gzip)
    assertObjectMatch(gzip, {
      timestamp: 0,
      filename: '',
    })
  })
  await t.step('parses unanonymized file', async () => {
    const file = new BIDSFileDeno('tests/data/gzip', 'stamped.gz')
    const gzip = await parseGzip(file)
    assert(gzip)
    assertObjectMatch(gzip, {
      timestamp: 0xb1d5cafe,
      filename: 'stamped',
    })
  })
  await t.step('parses commented file', async () => {
    const file = new BIDSFileDeno('tests/data/gzip', 'commented.gz')
    const gzip = await parseGzip(file)
    assert(gzip)
    assertObjectMatch(gzip, {
      timestamp: 0xb1d5cafe,
      filename: 'stamped',
      comment: 'comment',
    })
  })
  await t.step('gracefully handles empty file', async () => {
    const file = new BIDSFileDeno(
      'tests/data/bids-examples/7t_trt',
      'sub-01/ses-1/anat/sub-01_ses-1_T1map.nii.gz',
    )
    const gzip = await parseGzip(file)
    assert(!gzip)
  })
})

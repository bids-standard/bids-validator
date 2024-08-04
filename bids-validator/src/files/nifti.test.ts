import { assert, assertObjectMatch } from '../deps/asserts.ts'
import { FileIgnoreRules } from './ignore.ts'
import { BIDSFileDeno } from './deno.ts'

import { loadHeader } from './nifti.ts'

Deno.test('Test loading nifti header', async (t) => {
  const ignore = new FileIgnoreRules([])
  await t.step('Load header from compressed file', async () => {
    const path = 'sub-01/func/sub-01_task-rhymejudgment_bold.nii.gz'
    const root = './tests/data/valid_headers'
    const file = new BIDSFileDeno(root, path, ignore)
    const header = await loadHeader(file)
    assert(header !== undefined)
    assert(header['pixdim'].length === 8)
  })
  await t.step('Fail on non-nifti file', async () => {
    const path = 'sub-01/func/sub-01_task-rhymejudgment_events.tsv'
    const root = './tests/data/valid_headers'
    const file = new BIDSFileDeno(root, path, ignore)
    let error: any = undefined
    const header = await loadHeader(file).catch((e) => {
      error = e
    })
    assertObjectMatch(error, { key: 'NIFTI_HEADER_UNREADABLE' })
  })
})

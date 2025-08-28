import { assertEquals, assertObjectMatch } from '@std/assert'
import { loadHeader } from '../../files/nifti.ts'
import { BIDSFileDeno } from '../../files/deno.ts'

Deno.test('Test NIFTI-specific rules', async (t) => {
  await t.step('Test reading NIfTI axis codes' , async () => {
    for (const axcodes of [['R', 'A', 'S'], ['S', 'P', 'L'], ['A', 'I', 'R']]) {
      const testfile = `tests/data/${axcodes.join('')}.nii.gz`
      const header = await loadHeader(new BIDSFileDeno('', testfile))
      assertEquals(header.axis_codes, axcodes)
    }
  })
})

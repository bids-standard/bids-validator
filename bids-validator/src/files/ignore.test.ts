import { assertEquals } from '@std/assert'
import { FileIgnoreRules } from './ignore.ts'

Deno.test('Deno implementation of FileIgnoreRules', async (t) => {
  await t.step('handles basic .bidsignore rules', () => {
    const files = [
      '/sub-01/anat/sub-01_T1w.nii.gz',
      '/dataset_description.json',
      '/README',
      '/CHANGES',
      '/participants.tsv',
      '/.git/HEAD',
      '/.datalad/config',
      '/sub-01/anat/non-bidsy-file.xyz',
      '/explicit/full/path.nii',
    ]
    const rules = ['.git', '**/*.xyz', 'explicit/full/path.nii']
    const ignore = new FileIgnoreRules(rules)
    const filtered = files.filter((path) => !ignore.test(path))
    assertEquals(filtered, [
      '/sub-01/anat/sub-01_T1w.nii.gz',
      '/dataset_description.json',
      '/README',
      '/CHANGES',
      '/participants.tsv',
    ])
  })
})

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
  await t.step('Default ignores ignore opaque BIDS directories', () => {
    const files = [
      // Ignored directories
      '/derivatives/pipeline/file.nii',
      '/sourcedata/sub-01/anat/T1w.dcm',
      '/code/script.py',
      '/stimuli/image.png',
      '/log/run.log',
      '/doc/SOP.md',
      // Only ignored at top level
      '/sub-01/derivatives/pipeline/file.nii',
      '/sub-01/sourcedata/sub-01/anat/T1w.dcm',
      '/sub-01/code/script.py',
      '/sub-01/stimuli/image.png',
      '/sub-01/log/run.log',
      '/sub-01/doc/SOP.md',
    ]
    const ignore = new FileIgnoreRules([])
    const filtered = files.filter((path) => !ignore.test(path))
    assertEquals(filtered.length, 6)
  })
  await t.step('Default prunes ignore dotfiles at all levels', () => {
    const files = [
      '/.git/HEAD',
      '/.datalad/config',
      '/.gitignore',
      '/sub-01/.gitignore',
      '/sub-01/.DS_Store',
      '/sub-01/.cache/file',
    ]
    const ignore = new FileIgnoreRules([], 'prune')
    const filtered = files.filter((path) => !ignore.test(path))
    assertEquals(filtered.length, 0)
  })
  await t.step('Default prune does not prune .bidsignore', () => {
    const ignore = new FileIgnoreRules([], 'prune')
    assertEquals(ignore.test('/.bidsignore'), false)
  })
  await t.step('Adding default ignores does not prune .bidsignore', () => {
    const ignore = new FileIgnoreRules([], 'prune')
    ignore.addDefaults('ignore')
    assertEquals(ignore.test('/.bidsignore'), false)
  })
  await t.step('Default groups may be added post-init', () => {
    const files = [
      '/derivatives/pipeline/file.nii',
      '/sourcedata/sub-01/anat/T1w.dcm',
      '/.git/HEAD',
      '/.datalad/config',
      '/.gitignore',
      '/sub-01/.gitignore',
      '/sub-01/.DS_Store',
      '/sub-01/.cache/file',
      '/sub-01/anat/sub-01_T1w.nii.gz',
    ]
    const ignore = new FileIgnoreRules([], false)
    assertEquals(files.filter((path) => !ignore.test(path)).length, 9)
    ignore.addDefaults('ignore')
    assertEquals(files.filter((path) => !ignore.test(path)).length, 7)
    ignore.addDefaults('prune')
    assertEquals(files.filter((path) => !ignore.test(path)).length, 1)
  })
})

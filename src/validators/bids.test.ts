import { assert, assertEquals } from '@std/assert'
import { pathsToTree } from '../files/filetree.test.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { validate } from './bids.ts'
import { StringOpener } from '../files/openers.test.ts'

const dataset = pathsToTree([
  '/dataset_description.json',
  '/sub-01/anat/sub-01_T1w.nii.gz',
])

Deno.test('Smoke tests of main validation function', async (t) => {
  await t.step('Validating trivial with blacklist', async () => {
    let result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 0)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MRI'],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 1)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MEG'],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 0)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MEG', 'MRI'],
      datasetTypes: [],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 1)
  })
  await t.step('Validate configuration', async () => {
    const result = await validate(
      dataset,
      {
        datasetPath: '/dataset',
        debug: 'INFO',
        blacklistModalities: [],
        datasetTypes: [],
      },
      {
        ignore: [{ location: '/dataset_description.json' }],
      },
    )
    const errors = result.issues.filter({ severity: 'error' })
    const warnings = result.issues.filter({ severity: 'warning' })
    const ignored = result.issues.filter({ severity: 'ignore' })
    assert(errors.get({ code: 'JSON_KEY_RECOMMENDED' }).length === 0)
    assert(ignored.get({ code: 'JSON_KEY_RECOMMENDED' }).length > 0)
    assert(errors.get({ location: '/dataset_description.json' }).length === 0)
    assert(warnings.get({ location: '/dataset_description.json' }).length === 0)
  })
})

function datasetFrom(files: Record<string, string>) {
  const tree = pathsToTree(Object.keys(files))
  for (const [path, contents] of Object.entries(files)) {
    const file = tree.get(path.slice(1)) as BIDSFile
    file.opener = new StringOpener(contents)
  }
  return tree
}

Deno.test('Loader issues are reported at the failing file', async (t) => {
  const DD = '{"Name": "Test", "BIDSVersion": "1.10.0", "Authors": ["A"]}'
  const options = {
    datasetPath: '/dataset',
    debug: 'ERROR' as const,
    blacklistModalities: [],
    datasetTypes: [],
  }

  await t.step('invalid dataset_description.json', async () => {
    const tree = datasetFrom({
      '/dataset_description.json': '{"Name": ',
      '/sub-01/anat/sub-01_T1w.nii.gz': '',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    assert(issues.get({ code: 'JSON_INVALID', location: '/dataset_description.json' }).length > 0)
  })

  await t.step('unreadable NIfTI header and invalid sidecar', async () => {
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/sub-01/anat/sub-01_T1w.nii.gz': 'not a nifti',
      '/sub-01/anat/sub-01_T1w.json': '{"a": 1]',
    })
    const { issues } = await validate(tree, options)
    assertEquals(
      issues.get({
        code: 'NIFTI_HEADER_UNREADABLE',
        location: '/sub-01/anat/sub-01_T1w.nii.gz',
      }).length,
      1,
    )
    const invalid = issues.get({ code: 'JSON_INVALID' })
    assertEquals(invalid.length, 1)
    assertEquals(invalid[0].location, '/sub-01/anat/sub-01_T1w.json')
  })

  await t.step('ambiguous inheritance', async () => {
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/T1w.json': '{}',
      '/acq-MPRAGE_T1w.json': '{}',
      '/sub-01/anat/sub-01_acq-MPRAGE_T1w.nii.gz': '',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    assertEquals(
      issues.get({ code: 'MULTIPLE_INHERITABLE_FILES', location: '/T1w.json' }).length,
      1,
    )
    assertEquals(issues.get({ code: 'MULTIPLE_INHERITABLE_FILES' }).length, 1)
  })

  await t.step('ragged events.tsv', async () => {
    const events = '/sub-01/func/sub-01_task-rest_events.tsv'
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/sub-01/func/sub-01_task-rest_bold.nii.gz': '',
      [events]: 'onset\tduration\n1\t2\n3\n',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    assertEquals(issues.get({ code: 'TSV_EQUAL_ROWS', location: events }).length, 1)
    assertEquals(issues.get({ code: 'TSV_EQUAL_ROWS' }).length, 1)
  })

  await t.step('ragged .bvec', async () => {
    const bvec = '/sub-01/dwi/sub-01_dwi.bvec'
    const tree = datasetFrom({
      '/dataset_description.json': DD,
      '/sub-01/dwi/sub-01_dwi.nii.gz': '',
      '/sub-01/dwi/sub-01_dwi.bval': '0 1000\n',
      [bvec]: '0 1\n0 1\n0\n',
    })
    const { issues } = await validate(tree, { ...options, ignoreNiftiHeaders: true })
    const found = issues.get({ code: 'BVEC_ROW_LENGTH', location: bvec })
    assertEquals(found.length, 1)
    assertEquals(found[0].severity, 'error')
    assertEquals(issues.get({ code: 'BVEC_ROW_LENGTH' }).length, 1)
  })
})

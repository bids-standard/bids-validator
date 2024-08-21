import { assert } from '@std/assert'
import { pathsToTree } from '../files/filetree.ts'
import { validate } from './bids.ts'

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
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 0)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MRI'],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 1)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MEG'],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 0)

    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: ['MEG', 'MRI'],
    })
    assert(result.issues.get({ code: 'BLACKLISTED_MODALITY' }).length === 1)
  })
  await t.step('Validate configuration', async () => {
    let result = await validate(
      dataset,
      {
        datasetPath: '/dataset',
        debug: 'INFO',
        blacklistModalities: [],
      },
      {
        ignore: [{ location: '/dataset_description.json' }],
      },
    )
    let errors = result.issues.filter({ severity: 'error' })
    let warnings = result.issues.filter({ severity: 'warning' })
    let ignored = result.issues.filter({ severity: 'ignore' })
    assert(errors.get({ code: 'JSON_KEY_RECOMMENDED' }).length === 0)
    assert(ignored.get({ code: 'JSON_KEY_RECOMMENDED' }).length > 0)
    assert(errors.get({ location: '/dataset_description.json' }).length === 0)
    assert(warnings.get({ location: '/dataset_description.json' }).length === 0)
  })
})

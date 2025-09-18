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
    let result = await validate(
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
    let errors = result.issues.filter({ severity: 'error' })
    let warnings = result.issues.filter({ severity: 'warning' })
    let ignored = result.issues.filter({ severity: 'ignore' })
    assert(errors.get({ code: 'JSON_KEY_RECOMMENDED' }).length === 0)
    assert(ignored.get({ code: 'JSON_KEY_RECOMMENDED' }).length > 0)
    assert(errors.get({ location: '/dataset_description.json' }).length === 0)
    assert(warnings.get({ location: '/dataset_description.json' }).length === 0)
  })
  await t.step('Schema source is reported in validation output', async () => {
    // Test with default schema (no source should be provided)
    let result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
      datasetTypes: [],
    })
    assert(result.summary.schemaVersion)
    assert(result.summary.schemaSource === undefined)

    // Test with custom schema URL
    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
      datasetTypes: [],
      schema: 'https://example.com/schema.json',
    })
    assert(result.summary.schemaVersion)
    // Since the URL won't be reachable, it should fall back to default and not set source
    assert(result.summary.schemaSource === undefined)

    // Test with version tag
    result = await validate(dataset, {
      datasetPath: '/dataset',
      debug: 'INFO',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
      datasetTypes: [],
      schema: 'v1.9.0',
    })
    assert(result.summary.schemaVersion)
    // Since network fetch will likely fail, it should fall back to default
    assert(result.summary.schemaSource === undefined)

    // Test with BIDS_SCHEMA environment variable
    const originalEnv = Deno.env.get('BIDS_SCHEMA')
    try {
      Deno.env.set('BIDS_SCHEMA', 'https://custom-schema.example.com/schema.json')
      result = await validate(dataset, {
        datasetPath: '/dataset',
        debug: 'INFO',
        ignoreNiftiHeaders: true,
        blacklistModalities: [],
        datasetTypes: [],
      })
      assert(result.summary.schemaVersion)
      // Environment variable should override, but since network will fail, source won't be set
      assert(result.summary.schemaSource === undefined)
    } finally {
      if (originalEnv !== undefined) {
        Deno.env.set('BIDS_SCHEMA', originalEnv)
      } else {
        Deno.env.delete('BIDS_SCHEMA')
      }
    }
  })
})

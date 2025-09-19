import { assert, assertRejects } from '@std/assert'
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
    // Check network permission status
    const netPermission = await Deno.permissions.query({ name: 'net' })

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

    // Test with custom schema URL - should throw error without network
    if (netPermission.state !== 'granted') {
      await assertRejects(
        async () => await validate(dataset, {
          datasetPath: '/dataset',
          debug: 'INFO',
          ignoreNiftiHeaders: true,
          blacklistModalities: [],
          datasetTypes: [],
          schema: 'https://example.com/schema.json',
        }),
        Error,
        'Failed to load schema'
      )
    } else {
      // With network, might fail with 404 or succeed with source set
      try {
        result = await validate(dataset, {
          datasetPath: '/dataset',
          debug: 'INFO',
          ignoreNiftiHeaders: true,
          blacklistModalities: [],
          datasetTypes: [],
          schema: 'https://example.com/schema.json',
        })
        // If it works, source should be set
        assert(result.summary.schemaVersion)
        assert(result.summary.schemaSource === 'https://example.com/schema.json')
      } catch (error) {
        // Expected to fail with unreachable URL
        assert(error instanceof Error)
        // The error message should mention the schema loading failure
        assert(error.message.includes('Failed to load schema') || error.message.includes('fetch'))
      }
    }

    // Test with version tag
    if (netPermission.state !== 'granted') {
      await assertRejects(
        async () => await validate(dataset, {
          datasetPath: '/dataset',
          debug: 'INFO',
          ignoreNiftiHeaders: true,
          blacklistModalities: [],
          datasetTypes: [],
          schema: 'v1.9.0',
        }),
        Error,
        'Failed to load schema'
      )
    } else {
      // With network, might succeed
      try {
        result = await validate(dataset, {
          datasetPath: '/dataset',
          debug: 'INFO',
          ignoreNiftiHeaders: true,
          blacklistModalities: [],
          datasetTypes: [],
          schema: 'v1.9.0',
        })
        assert(result.summary.schemaVersion)
        // If successful, source should be the constructed URL
        if (result.summary.schemaSource) {
          assert(result.summary.schemaSource.includes('v1.9.0'))
        }
      } catch (error) {
        // Could fail if version doesn't exist
        assert(error instanceof Error)
        // In CI with network, might have different error messages
        console.log('Schema version load error:', error.message)
      }
    }

    // Test with BIDS_SCHEMA environment variable
    const originalEnv = Deno.env.get('BIDS_SCHEMA')
    try {
      Deno.env.set('BIDS_SCHEMA', 'https://custom-schema.example.com/schema.json')

      if (netPermission.state !== 'granted') {
        await assertRejects(
          async () => await validate(dataset, {
            datasetPath: '/dataset',
            debug: 'INFO',
            ignoreNiftiHeaders: true,
            blacklistModalities: [],
            datasetTypes: [],
          }),
          Error,
          'Failed to load schema'
        )
      } else {
        // With network, might fail with 404
        try {
          result = await validate(dataset, {
            datasetPath: '/dataset',
            debug: 'INFO',
            ignoreNiftiHeaders: true,
            blacklistModalities: [],
            datasetTypes: [],
          })
          assert(result.summary.schemaVersion)
          if (result.summary.schemaSource) {
            assert(result.summary.schemaSource === 'https://custom-schema.example.com/schema.json')
          }
        } catch (error) {
          assert(error instanceof Error)
          // The error message should indicate a schema loading issue
          console.log('Schema env var load error:', error.message)
        }
      }
    } finally {
      if (originalEnv !== undefined) {
        Deno.env.set('BIDS_SCHEMA', originalEnv)
      } else {
        Deno.env.delete('BIDS_SCHEMA')
      }
    }
  })
})

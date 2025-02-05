import { assert } from '@std/assert'
import { pathsToTree } from '../files/filetree.ts'
import { validate } from '../validators/bids.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { streamFromString } from './utils.ts'

Deno.test('Regression tests', async (t) => {
  await t.step('Verify ignored files in scans.tsv do not trigger error', async () => {
    const paths = [
      '/dataset_description.json',
      '/sub-01/anat/sub-01_T1w.nii.gz',
      '/sub-01/anat/sub-01_CT.nii.gz', // unknown file
      '/sub-01/sub-01_scans.tsv',
    ]
    const ignore = ['*_CT.nii.gz']
    const scans_content = 'filename\nanat/sub-01_T1w.nii.gz\nanat/sub-01_CT.nii.gz\n'

    // Without ignore, NOT_INCLUDED is triggered for CT, but the scans file is happy
    let ds = pathsToTree(paths)
    let scans_tsv = ds.get('sub-01/sub-01_scans.tsv') as BIDSFile
    scans_tsv.stream = streamFromString(scans_content)
    let result = await validate(ds, {
      datasetPath: '/dataset',
      debug: 'ERROR',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
    })
    assert(result.issues.get({ code: 'NOT_INCLUDED' }).length == 1)
    assert(result.issues.get({ code: 'SCANS_FILENAME_NOT_MATCH_DATASET' }).length == 0)

    // With ignore, NOT_INCLUDED is not triggered for CT, and the scans file is still happy
    ds = pathsToTree(paths, ignore)
    scans_tsv = ds.get('sub-01/sub-01_scans.tsv') as BIDSFile
    scans_tsv.stream = streamFromString(scans_content)
    result = await validate(ds, {
      datasetPath: '/dataset',
      debug: 'ERROR',
      ignoreNiftiHeaders: true,
      blacklistModalities: [],
    })
    assert(result.issues.get({ code: 'NOT_INCLUDED' }).length == 0)
    assert(result.issues.get({ code: 'SCANS_FILENAME_NOT_MATCH_DATASET' }).length == 0)
  })
})

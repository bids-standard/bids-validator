import { assert, assertObjectMatch } from '@std/assert'
import { loadSchema } from '../setup/loadSchema.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { pathsToTree } from '../files/filetree.ts'
import type { BIDSFile } from '../types/filetree.ts'

import { findDatatype, modalityTable } from './datatypes.ts'

const schema = await loadSchema()

// Creates a file object as part of a minimal file tree
const makeFile = (path: string): BIDSFile => pathsToTree([path]).get(path) as BIDSFile

Deno.test('test modalityTable', async (t) => {
  await t.step('empty schema', () => {
    assertObjectMatch(modalityTable({}), {})
  })

  await t.step('real schema', async () => {
    const table = modalityTable(schema)
    // Memoization check
    assert(modalityTable(schema) == table)
    // spot check
    assertObjectMatch(table, {
      'anat': 'mri',
      'perf': 'mri',
      'eeg': 'eeg',
    })
  })
})

Deno.test('test findDatatype', async (t) => {
  await t.step('root files', async () => {
    const path = makeFile('/participants.tsv')
    assertObjectMatch(findDatatype(path, schema), { datatype: '', modality: '' })
  })
  await t.step('non-datatype parent', async () => {
    const path = makeFile('/stimuli/image.png')
    assertObjectMatch(findDatatype(path, schema), { datatype: '', modality: '' })
  })
  await t.step('phenotype file', async () => {
    const path = makeFile('/phenotype/survey.tsv')
    assertObjectMatch(findDatatype(path, schema), { datatype: 'phenotype', modality: '' })
  })
  await t.step('data files', async () => {
    for (
      const [filename, datatype, modality] of [
        ['/sub-01/anat/sub-01_T1w.nii.gz', 'anat', 'mri'],
        ['/sub-01/eeg/sub-01_task-rest_eeg.edf', 'eeg', 'eeg'],
        ['/sub-01/perf/sub-01_task-rest_bold.nii.gz', 'perf', 'mri'],
      ]
    ) {
      const path = makeFile(filename)
      assertObjectMatch(findDatatype(path, schema), { datatype, modality })
    }
  })
})

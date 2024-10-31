import { assert, assertObjectMatch } from '@std/assert'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { BIDSContext } from './context.ts'
import { dataFile, rootFileTree } from './fixtures.test.ts'

Deno.test('test context LoadSidecar', async (t) => {
  const context = new BIDSContext(dataFile)
  await context.loadSidecar()
  await t.step('sidecar overwrites correct fields', () => {
    const { rootOverwrite, subOverwrite } = context.sidecar
    assertObjectMatch(context.sidecar, {
      rootOverwrite: 'anat',
      subOverwrite: 'anat',
    })
  })
  await t.step('sidecar adds new fields at each level', () => {
    const { rootValue, subValue, anatValue } = context.sidecar
    assertObjectMatch(context.sidecar, {
      rootValue: 'root',
      subValue: 'subject',
      anatValue: 'anat',
    })
  })
})

Deno.test('test context loadSubjects', async (t) => {
  const context = new BIDSContext(dataFile, undefined, rootFileTree)
  await context.loadSubjects()
  await t.step('context produces correct subjects object', () => {
    assert(context.dataset.subjects, 'subjects object exists')
    assert(context.dataset.subjects.sub_dirs.length == 1, 'there is only one sub dir found')
    assert(context.dataset.subjects.sub_dirs[0] == 'sub-01', 'that sub dir is sub-01')
    // no participants.tsv so this should be empty
    assert(context.dataset.subjects.participant_id == undefined, 'no participant_id is populated')
  })
})

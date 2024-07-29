import { assert } from '../deps/asserts.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { BIDSContext } from './context.ts'
import { dataFile, rootFileTree } from './fixtures.test.ts'

Deno.test('test context LoadSidecar', async (t) => {
  const context = new BIDSContext(rootFileTree, dataFile, new DatasetIssues())
  await context.loadSidecar(rootFileTree)
  await t.step('sidecar overwrites correct fields', () => {
    const { rootOverwrite, subOverwrite } = context.sidecar
    assert(rootOverwrite === 'anat')
    assert(subOverwrite === 'anat')
  })
  await t.step('sidecar adds new fields at each level', () => {
    const { rootValue, subValue, anatValue } = context.sidecar
    assert(rootValue === 'root')
    assert(subValue === 'subject')
    assert(anatValue === 'anat')
  })
})

Deno.test('test context loadSubjects', async (t) => {
  const context = new BIDSContext(rootFileTree, dataFile, new DatasetIssues())
  await context.loadSubjects()
  await t.step('context produces correct subjects object', () => {
    assert(context.dataset.subjects, 'subjects object exists')
    assert(context.dataset.subjects.sub_dirs.length == 1, 'there is only one sub dir found')
    assert(context.dataset.subjects.sub_dirs[0] == 'sub-01', 'that sub dir is sub-01')
    // no participants.tsv so this should be empty
    assert(context.dataset.subjects.participant_id == undefined, 'no participant_id is populated')
  })
})

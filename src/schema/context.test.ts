import { assert, assertEquals, assertObjectMatch } from '@std/assert'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import type { BIDSFile } from '../types/filetree.ts'
import type { FileTree } from '../types/filetree.ts'
import type { BIDSContextDataset } from './context.ts'
import { BIDSContext } from './context.ts'
import { dataFile, rootFileTree } from './fixtures.test.ts'

/* Async helper to create a loaded BIDSContext */
export async function makeBIDSContext(
  file: BIDSFile,
  dsContext?: BIDSContextDataset,
  fileTree?: FileTree,
): Promise<BIDSContext> {
  const context = new BIDSContext(file, dsContext, fileTree)
  await context.loaded
  return context
}

Deno.test('test context LoadSidecar', async (t) => {
  const context = await makeBIDSContext(dataFile)
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
  await t.step('Warnings are emitted for overriding sidecar fields', () => {
    assertEquals(
      context.dataset.issues.get({ code: 'SIDECAR_FIELD_OVERRIDE' }).length,
      2,
    )
  })
})

Deno.test('test context loadSubjects', async (t) => {
  const context = await makeBIDSContext(dataFile, undefined, rootFileTree)
  await t.step('context produces correct subjects object', () => {
    assert(context.dataset.subjects, 'subjects object exists')
    assert(context.dataset.subjects.sub_dirs.length == 1, 'there is only one sub dir found')
    assert(context.dataset.subjects.sub_dirs[0] == 'sub-01', 'that sub dir is sub-01')
    // no participants.tsv so this should be empty
    assert(context.dataset.subjects.participant_id == undefined, 'no participant_id is populated')
  })
})

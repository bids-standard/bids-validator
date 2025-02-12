import type { formatAssertIssue, validatePath } from './common.ts'
import { assert, assertEquals } from '@std/assert'
import { BIDSFileDeno, readFileTree } from '../../files/deno.ts'
import type { DatasetIssues } from '../../issues/datasetIssues.ts'
import { loadSchema } from '../../setup/loadSchema.ts'
import { BIDSContext, BIDSContextDataset } from '../../schema/context.ts'
import type { BIDSFile, FileTree } from '../../types/filetree.ts'
import type { GenericSchema } from '../../types/schema.ts'
import { hedValidate } from '../../validators/hed.ts'

Deno.test('hed-validator not triggered', async (t) => {
  const PATH = 'tests/data/bids-examples/ds003'
  const tree = await readFileTree(PATH)
  const schema = await loadSchema()
  const dsContext = new BIDSContextDataset({
    dataset_description: {
      'HEDVersion': ['bad_version'],
    },
  })
  await t.step('detect hed returns false', async () => {
    const eventFile = tree.get('sub-01/func/sub-01_task-rhymejudgment_events.tsv')
    assert(eventFile !== undefined)
    assert(eventFile instanceof BIDSFileDeno)
    const context = new BIDSContext(eventFile, dsContext)
    await context.asyncLoads()
    await hedValidate(schema as unknown as GenericSchema, context)
    assert(context.dataset.issues.size === 0)
  })
})

Deno.test('hed-validator fails with bad schema version', async (t) => {
  const PATH = 'tests/data/bids-examples/eeg_ds003645s_hed_library'
  const tree = await readFileTree(PATH)
  const schema = await loadSchema()
  const dsContext = new BIDSContextDataset({
    dataset_description: {
      'HEDVersion': ['bad_version'],
    },
  })
  await t.step('detect hed returns false', async () => {
    const eventFile = tree.get('sub-002/eeg/sub-002_task-FacePerception_run-3_events.tsv')
    assert(eventFile !== undefined)
    assert(eventFile instanceof BIDSFileDeno)
    const context = new BIDSContext(eventFile, dsContext)
    await context.asyncLoads()
    await hedValidate(schema as unknown as GenericSchema, context)
    assertEquals(context.dataset.issues.size, 1)
    assertEquals(context.dataset.issues.get({ code: 'HED_ERROR' }).length, 1)
  })
})

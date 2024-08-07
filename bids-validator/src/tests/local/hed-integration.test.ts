import { formatAssertIssue, validatePath } from './common.ts'
import { assert, assertEquals } from '../../deps/asserts.ts'
import { BIDSFileDeno, readFileTree } from '../../files/deno.ts'
import { DatasetIssues } from '../../issues/datasetIssues.ts'
import { loadSchema } from '../../setup/loadSchema.ts'
import { BIDSContext, BIDSContextDataset } from '../../schema/context.ts'
import { BIDSFile, FileTree } from '../../types/filetree.ts'
import { GenericSchema } from '../../types/schema.ts'
import { hedValidate } from '../../validators/hed.ts'

function getFile(fileTree: FileTree, path: string) {
  let [current, ...nextPath] = path.split('/')
  if (nextPath.length === 0) {
    const target = fileTree.files.find((x) => x.name === current)
    if (target) {
      return target
    }
    const dirTarget = fileTree.directories.find((x) => x.name === nextPath[0])
    return dirTarget
  } else {
    const nextTree = fileTree.directories.find((x) => x.name === current)
    if (nextTree) {
      return getFile(nextTree, nextPath.join('/'))
    }
  }
  return undefined
}

Deno.test('hed-validator not triggered', async (t) => {
  const PATH = 'tests/data/bids-examples/ds003'
  const tree = await readFileTree(PATH)
  const schema = await loadSchema()
  const dsContext = new BIDSContextDataset({dataset_description: {
    'HEDVersion': ['bad_version'],
  }})
  await t.step('detect hed returns false', async () => {
    const eventFile = getFile(tree, 'sub-01/func/sub-01_task-rhymejudgment_events.tsv')
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
  const dsContext = new BIDSContextDataset({dataset_description: {
    'HEDVersion': ['bad_version'],
  }})
  await t.step('detect hed returns false', async () => {
    const eventFile = getFile(tree, 'sub-002/eeg/sub-002_task-FacePerception_run-3_events.tsv')
    assert(eventFile !== undefined)
    assert(eventFile instanceof BIDSFileDeno)
    const context = new BIDSContext(eventFile, dsContext)
    await context.asyncLoads()
    await hedValidate(schema as unknown as GenericSchema, context)
    assert(context.dataset.issues.size === 1)
    assert(context.dataset.issues.has('HED_ERROR'))
  })
})

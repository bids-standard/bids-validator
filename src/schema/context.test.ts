import { assert, assertEquals, assertObjectMatch } from '@std/assert'
import type { BIDSFile } from '../types/filetree.ts'
import type { FileTree } from '../types/filetree.ts'
import type { Schema } from '../types/schema.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { StringOpener } from '../files/openers.test.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { BIDSContext, BIDSContextDataset } from './context.ts'
import { dataFile, motionFileTree, rootFileTree } from './fixtures.test.ts'

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
    assertObjectMatch(context.sidecar, {
      rootOverwrite: 'anat',
      subOverwrite: 'anat',
    })
  })
  await t.step('sidecar adds new fields at each level', () => {
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

Deno.test('BIDSContextDataset opaqueDirectories respects DatasetType', async (t) => {
  const schema = {
    objects: { extensions: {} },
    rules: {
      directories: {
        raw: {
          a: { opaque: true, name: 'a' },
          b: { opaque: false, name: 'b' },
        },
        derivative: {
          c: { opaque: true, name: 'c' },
          d: { opaque: false, name: 'd' },
        },
      },
    },
  } as unknown as Schema

  await t.step('default (raw) DatasetType populates raw opaque dirs', () => {
    const ds = new BIDSContextDataset({ schema })
    assertEquals(ds.opaqueDirectories.has('/a'), true)
    assertEquals(ds.opaqueDirectories.has('/b'), false)
    assertEquals(ds.opaqueDirectories.has('/c'), false)
  })

  await t.step('updating dataset_description switches opaque dirs', () => {
    const ds = new BIDSContextDataset({ schema })
    ds.dataset_description = { DatasetType: 'derivative' }
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
    assertEquals(ds.opaqueDirectories.has('/d'), false)
  })

  await t.step('explicit derivative DatasetType on construction', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { DatasetType: 'derivative' },
    })
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
    assertEquals(ds.opaqueDirectories.has('/d'), false)
  })

  await t.step('resetting to raw restores raw opaque dirs', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { DatasetType: 'derivative' },
    })
    ds.dataset_description = { DatasetType: 'raw' }
    assertEquals(ds.opaqueDirectories.has('/a'), true)
    assertEquals(ds.opaqueDirectories.has('/b'), false)
    assertEquals(ds.opaqueDirectories.has('/c'), false)
  })

  await t.step('GeneratedBy infers derivative when DatasetType missing', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { GeneratedBy: [{ Name: 'foo' }] },
    })
    assertEquals(ds.dataset_description.DatasetType, 'derivative')
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
  })
})

Deno.test('test context loadColumns for headerless motion.tsv', async (t) => {
  const schema = await loadSchema()
  const motionFile = motionFileTree.get(
    'sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv',
  ) as BIDSFile
  const dsContext = new BIDSContextDataset({ schema })
  const context = await makeBIDSContext(motionFile, dsContext, motionFileTree)

  await t.step('columns are named from the channels.tsv name column', () => {
    assertEquals(context.columns['t1_acc_x'], ['0', '0.1'])
    assertEquals(context.columns['t1_acc_y'], ['0', '0.2'])
    assertEquals(context.columns['t1_acc_z'], ['0', '0.3'])
  })

  await t.step('first data row does not raise duplicate header issue', () => {
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_COLUMN_HEADER_DUPLICATE' }).length,
      0,
    )
  })

  await t.step('missing channels.tsv leaves columns empty', async () => {
    const tree = pathsToTree([
      '/dataset_description.json',
      '/sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv',
    ])
    const file = tree.get('sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv') as BIDSFile
    file.opener = new StringOpener('0\t0\t0\n')
    const context = await makeBIDSContext(file, new BIDSContextDataset({ schema }), tree)
    assertEquals(Object.keys(context.columns).length, 0)
  })

  await t.step('mismatched row lengths raise TSV_EQUAL_ROWS', async () => {
    const tree = pathsToTree([
      '/dataset_description.json',
      '/sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv',
      '/sub-01/motion/sub-01_task-walk_tracksys-imu_channels.tsv',
    ])
    const file = tree.get('sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv') as BIDSFile
    file.opener = new StringOpener('0\t0\n')
    const channelsFile = tree.get(
      'sub-01/motion/sub-01_task-walk_tracksys-imu_channels.tsv',
    ) as BIDSFile
    channelsFile.opener = new StringOpener(
      'name\ttype\nt1_acc_x\tACCEL\nt1_acc_y\tACCEL\nt1_acc_z\tACCEL\n',
    )
    const context = await makeBIDSContext(file, new BIDSContextDataset({ schema }), tree)
    assertEquals(context.dataset.issues.get({ code: 'TSV_EQUAL_ROWS' }).length, 1)
    assertEquals(Object.keys(context.columns).length, 0)
  })
})

Deno.test('test context loadColumns for tsv.gz', async (t) => {
  const schema = await loadSchema()
  const tree = pathsToTree([
    '/dataset_description.json',
    '/sub-01/func/sub-01_task-rest_recording-cardiac_physio.json',
    '/sub-01/func/sub-01_task-rest_recording-cardiac_physio.tsv.gz',
  ])
  const sidecar = tree.get(
    'sub-01/func/sub-01_task-rest_recording-cardiac_physio.json',
  ) as BIDSFile
  sidecar.opener = new StringOpener(JSON.stringify({ Columns: ['cardiac'] }))
  const file = tree.get('sub-01/func/sub-01_task-rest_recording-cardiac_physio.tsv.gz') as BIDSFile
  file.opener = new StringOpener('1\n2\n')

  await t.step('uncompressed contents raise INVALID_GZIP', async () => {
    const context = await makeBIDSContext(file, new BIDSContextDataset({ schema }), tree)
    assertEquals(context.dataset.issues.get({ code: 'INVALID_GZIP' }).length, 1)
    assertEquals(Object.keys(context.columns).length, 0)
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

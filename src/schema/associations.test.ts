import { assertEquals, assertObjectMatch } from '@std/assert'
import type { BIDSFile } from '../types/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { motionFileTree, rootFileTree } from './fixtures.test.ts'
import { BIDSContext, BIDSContextDataset } from './context.ts'
import { buildAssociations, type ChannelsWithName } from './associations.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { StringOpener } from '../files/openers.test.ts'
import type { ValidatorOptions } from '../setup/options.ts'

Deno.test('Test association loading', async (t) => {
  const schema = await loadSchema()
  await t.step('Load associations for events.tsv', async () => {
    const eventsFile = rootFileTree.get(
      'sub-01/ses-01/func/sub-01_ses-01_task-movie_physio.tsv.gz',
    ) as BIDSFile
    const context = new BIDSContext(eventsFile, undefined, rootFileTree)
    context.dataset.schema = schema
    const associations = await buildAssociations(context)
    assertObjectMatch(associations, {
      events: {
        sidecar: {
          StimulusPresentation: {
            ScreenDistance: 1.8,
            ScreenOrigin: ['top', 'left'],
            ScreenResolution: [1920, 1080],
            ScreenSize: [0.472, 0.265],
          },
        },
      },
    })
  })

  await t.step('Load channels association with name column for motion.tsv', async () => {
    const motionFile = motionFileTree.get(
      'sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv',
    ) as BIDSFile
    const context = new BIDSContext(motionFile, undefined, motionFileTree)
    context.dataset.schema = schema
    const associations = await buildAssociations(context)
    assertObjectMatch(associations, {
      channels: {
        path: '/sub-01/motion/sub-01_task-walk_tracksys-imu_channels.tsv',
        name: ['t1_acc_x', 't1_acc_y', 't1_acc_z'],
        type: ['ACCEL', 'ACCEL', 'ACCEL'],
      },
    })
  })
})

Deno.test('channels association is not truncated by maxRows', async () => {
  const schema = await loadSchema()
  const tree = pathsToTree([
    '/dataset_description.json',
    '/sub-01/nirs/sub-01_task-rest_nirs.snirf',
    '/sub-01/nirs/sub-01_task-rest_channels.tsv',
  ])
  const nRows = 1500
  const rows = Array.from(
    { length: nRows },
    (_, i) => `S${i}-D${i}\tNIRSCWHBO\t${i % 3 === 0 ? 'true' : 'false'}\n`,
  )
  const channels = tree.get('sub-01/nirs/sub-01_task-rest_channels.tsv') as BIDSFile
  channels.opener = new StringOpener('name\ttype\tshort_channel\n' + rows.join(''))

  const dataFile = tree.get('sub-01/nirs/sub-01_task-rest_nirs.snirf') as BIDSFile
  const dsContext = new BIDSContextDataset({
    tree,
    schema,
    options: { maxRows: 1000 } as ValidatorOptions,
  })
  const context = new BIDSContext(dataFile, dsContext, tree)
  const associations = await buildAssociations(context)

  const ch = associations.channels as ChannelsWithName
  assertEquals(ch.type?.length, nRows)
  assertEquals(ch.short_channel?.filter((v) => v === 'true').length, 500)
})

import { assertEquals, assertObjectMatch } from '@std/assert'
import type { Associations } from '@bids/schema/context'
import type { BIDSFile } from '../types/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { StringOpener } from '../files/openers.test.ts'
import { motionFileTree, rootFileTree } from './fixtures.test.ts'
import { BIDSContext, BIDSContextDataset } from './context.ts'
import { buildAssociations } from './associations.ts'
import { walkFileTree } from './walk.ts'
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

Deno.test({
  name: 'Load scans association from the row of the validated file',
  // XXX Remove ignore condition once bids-specification#2508 is merged and released
  ignore: (await Deno.permissions.request({ name: 'net' })).state === 'denied',
  async fn() {
    const tree = pathsToTree([
      '/sub-01/sub-01_scans.tsv',
      '/sub-01/anat/sub-01_T1w.nii.gz',
      '/sub-01/anat/sub-01_T2w.nii.gz',
      '/sub-01/anat/sub-01_FLAIR.nii.gz',
      '/sub-01/func/sub-01_task-rest_bold.nii.gz',
      '/sub-01/meg/sub-01_task-rest_meg.ds/sub-01_task-rest_meg.meg4',
    ])
    ;(tree.get('sub-01/sub-01_scans.tsv') as BIDSFile).opener = new StringOpener(
      'filename\tacq_time\tduration\n' +
        'anat/sub-01_T2w.nii.gz\tn/a\t\n' +
        'anat/sub-01_FLAIR.nii.gz\t\t0\n' +
        'func/sub-01_task-rest_bold.nii.gz\t\tn/a\n' +
        'anat/sub-01_T1w.nii.gz\t2010-01-01T09:00:00\t240.5\n' +
        'meg/sub-01_task-rest_meg.ds\t2010-01-01T10:00:00\t360\n',
    )
    // XXX Remove schema override once bids-specification#2508 is merged and released
    const schema = await loadSchema(
      'https://bids-specification--2508.org.readthedocs.build/en/2508/schema.json',
    )
    const dataset = new BIDSContextDataset({ tree, schema })
    const found: Record<string, unknown> = {}
    for await (const context of walkFileTree(dataset)) {
      const { scans } = context.associations as Record<string, unknown>
      if (scans) found[context.path] = scans
    }
    const path = '/sub-01/sub-01_scans.tsv'
    assertEquals(found, {
      '/sub-01/anat/sub-01_T1w.nii.gz': { path, acq_time: '2010-01-01T09:00:00', duration: 240.5 },
      '/sub-01/meg/sub-01_task-rest_meg.ds/': {
        path,
        acq_time: '2010-01-01T10:00:00',
        duration: 360,
      },
      '/sub-01/anat/sub-01_FLAIR.nii.gz': { path, duration: 0 },
      // n/a, empty, or not listed: no values
      '/sub-01/anat/sub-01_T2w.nii.gz': { path },
      '/sub-01/func/sub-01_task-rest_bold.nii.gz': { path },
    })
  },
})

type Assoc = Required<Associations>

Deno.test('Association truncation', async (t) => {
  const schema = await loadSchema()
  async function check<
    A extends keyof Assoc,
    F extends keyof Assoc[A],
  >(
    data_path: string,
    associated_path: string,
    association: A,
    column: F & string,
    truncated: boolean,
    column_generator: (idx: number) => void,
  ): Promise<void> {
    const tree = pathsToTree(['/dataset_description.json', data_path, associated_path])
    const nRows = 20
    const rows = Array.from({ length: nRows }, (_, i) => column_generator(i))

    const data_file = tree.get(data_path) as BIDSFile
    const associated_file = tree.get(associated_path) as BIDSFile
    associated_file.opener = new StringOpener(`${column}\n${rows.join('\n')}`)

    const dsContext = new BIDSContextDataset({
      tree,
      schema,
      options: { maxRows: nRows / 2 } as ValidatorOptions,
    })
    const context = new BIDSContext(data_file, dsContext, tree)
    await context.loaded
    const assoc = context.associations[association] as Assoc[A]
    const col = assoc[column] as Array<string | number>
    assertEquals(col.length, truncated ? nRows / 2 : nRows)
  }

  await t.step('channels.tsv is not truncated', async () => {
    await check(
      '/sub-01/nirs/sub-01_task-rest_nirs.snirf',
      '/sub-01/nirs/sub-01_task-rest_channels.tsv',
      'channels',
      'short_channel',
      false,
      (i: number) => i % 3 === 0 ? 'true' : 'false',
    )
  })
})

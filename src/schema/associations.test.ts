import { assertObjectMatch } from '@std/assert'
import type { BIDSFile } from '../types/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { motionFileTree, rootFileTree } from './fixtures.test.ts'
import { BIDSContext } from './context.ts'
import { buildAssociations } from './associations.ts'
import { assertEquals } from '@std/assert'
import { pathsToTree } from '../files/filetree.test.ts'
import { annexIssue } from '../files/annexKey.ts'
import { RejectingFileOpener } from '../files/openers.ts'
import { StringOpener } from '../files/openers.test.ts'
import { BIDSContextDataset } from './context.ts'
import { readText } from '../files/access.ts'

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

Deno.test('Associations of files without content', async (t) => {
  const schema = await loadSchema()
  const nifti = '/sub-01/dwi/sub-01_dwi.nii.gz'
  const contextFor = (assocPath: string, opener: BIDSFile['opener']) => {
    readText.cache.clear()
    const tree = pathsToTree([nifti, assocPath])
    ;(tree.get(nifti.slice(1)) as BIDSFile).opener = new StringOpener('')
    ;(tree.get(assocPath.slice(1)) as BIDSFile).opener = opener
    const dsContext = new BIDSContextDataset({ schema, tree })
    const context = new BIDSContext(tree.get(nifti.slice(1)) as BIDSFile, dsContext, tree)
    return { context, dsContext }
  }

  await t.step('an unresolvable association is not reported', async () => {
    const bval = '/sub-01/dwi/sub-01_dwi.bval'
    const { context, dsContext } = contextFor(
      bval,
      new RejectingFileOpener(
        8,
        annexIssue('UNLOCKED_ANNEX_DATA', 'MD5E-s8--0123456789abcdef0123456789abcdef.bval'),
      ),
    )
    const associations = await buildAssociations(context)
    assertEquals(associations.bval, undefined)
    assertEquals(dsContext.issues.get({ location: bval }).length, 0)
  })

  await t.step('a load issue in an association is still reported', async () => {
    const bvec = '/sub-01/dwi/sub-01_dwi.bvec'
    const { context, dsContext } = contextFor(bvec, new StringOpener('0 1\n0 1\n0\n'))
    await buildAssociations(context)
    const issues = dsContext.issues.get({ code: 'BVEC_ROW_LENGTH', location: bvec })
    assertEquals(issues.length >= 1, true)
  })
  readText.cache.clear()
})

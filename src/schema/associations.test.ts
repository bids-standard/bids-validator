import { assertEquals, assertObjectMatch } from '@std/assert'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { nullReadBytes } from '../tests/nullReadBytes.ts'
import { rootFileTree } from './fixtures.test.ts'
import { BIDSContext } from './context.ts'
import { buildAssociations } from './associations.ts'

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
})

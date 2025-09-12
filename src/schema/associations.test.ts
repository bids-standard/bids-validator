import { assertEquals, assertObjectMatch } from '@std/assert'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { pathsToTree } from '../files/filetree.ts'
import { nullReadBytes } from '../tests/nullReadBytes.ts'
import { rootFileTree } from './fixtures.test.ts'
import { BIDSContext } from './context.ts'
import { buildAssociations } from './associations.ts'

Deno.test('Test association loading', async (t) => {
  const schema = await loadSchema()
  await t.step('Load associations for events.tsv', async () => {
    const eventsFile = rootFileTree.get('sub-01/ses-01/func/sub-01_ses-01_task-movie_events.tsv') as BIDSFile
    const context = new BIDSContext(eventsFile, undefined, rootFileTree)
    context.dataset.schema = schema
    const associations = await buildAssociations(context)
    assertObjectMatch(associations, {
      physio: {
        sidecar: { SamplingFrequency: 100, StartTime: 0, PhysioType: "eyetrack" },
      }
    })
  })
})

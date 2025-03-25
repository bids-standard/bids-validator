import { assert, assertEquals } from '@std/assert'
import { BIDSContext, BIDSContextDataset } from './context.ts'
import { walkFileTree } from './walk.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { simpleDataset, simpleDatasetFileCount } from '../tests/simple-dataset.ts'
import { pathsToTree } from '../files/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'

Deno.test('file tree walking', async (t) => {
  const schema = await loadSchema()
  await t.step('visits each file and creates a BIDSContext', async () => {
    const dsContext = new BIDSContextDataset({ tree: simpleDataset, schema: schema })
    for await (const context of walkFileTree(dsContext)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
    }
  })
  await t.step('visits every file expected', async () => {
    const dsContext = new BIDSContextDataset({ tree: simpleDataset, schema: schema })
    let accumulator = 0
    for await (const context of walkFileTree(dsContext)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
      if (!context.directory) {
        accumulator = accumulator + 1
      }
    }
    assertEquals(
      accumulator,
      simpleDatasetFileCount,
      'visited file count does not match expected value',
    )
  })
  await t.step('produces context for opaque directory', async () => {
    simpleDataset.directories.push(pathsToTree(['/code/code.sh']).directories[0])
    const dsContext = new BIDSContextDataset({ tree: simpleDataset, schema: schema })
    let accumulator = 0
    for await (const context of walkFileTree(dsContext)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
      if (!context.directory || context.file.name === 'code/') {
        accumulator = accumulator + 1
      }
    }
    assertEquals(
      accumulator,
      simpleDatasetFileCount + 1,
      'visited file count does not match expected value',
    )
  })
})

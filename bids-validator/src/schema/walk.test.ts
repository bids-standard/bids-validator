import { assert } from '../deps/asserts.ts'
import { BIDSContext } from './context.ts'
import { walkFileTree } from './walk.ts'
import { simpleDataset } from '../tests/simple-dataset.ts'

Deno.test('file tree walking', async t => {
  await t.step('visits each file and creates a BIDSContext', async () => {
    for await (const context of walkFileTree(simpleDataset)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
    }
  })
})

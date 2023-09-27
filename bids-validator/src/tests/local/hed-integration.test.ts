import { assert, assertEquals } from '../../deps/asserts.ts'
import { validatePath, formatAssertIssue } from './common.ts'
import { validate } from '../../validators/bids.ts'
import { parseOptions } from '../../setup/options.ts'
import { testDetectHed } from '../../validators/hed.ts'

Deno.test('hed-validator not triggered', async (t) => {
  const PATH = 'tests/data/bids-examples/ds003'
  const { tree, result } = await validatePath(t, PATH)

  await t.step('detect hed returns false', async () => {
    const new_result = await validate(tree, {
      ...(await parseOptions([PATH]))
    })
    assert(!testDetectHed())
  })
})

Deno.test('hed-validator integration test', async (t) => {
  const PATH = 'tests/data/bids-examples/eeg_ds003645s_hed'
  const { tree, result } = await validatePath(t, PATH)

  tree.files = tree.files.filter(f => f.name !== 'task-FacePerception_events.json')
  await t.step('generates hed error on missing events json', async () => {
    const new_result = await validate(tree, {
      ...(await parseOptions([PATH]))
    })
    assert(new_result.issues.has("HED_ERROR"))
  })
})



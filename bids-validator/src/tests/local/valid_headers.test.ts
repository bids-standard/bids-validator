// Deno runtime tests for tests/data/valid_headers
import { assert } from '../../deps/asserts.ts'
import { validatePath } from './common.ts'

const PATH = 'tests/data/valid_headers'

Deno.test('valid_headers dataset', async (t) => {
  const { tree, result } = await validatePath(t, PATH)

  await t.step('correctly ignores .bidsignore files', () => {
    assert(result.issues.get('NOT_INCLUDED') === undefined)
  })
})

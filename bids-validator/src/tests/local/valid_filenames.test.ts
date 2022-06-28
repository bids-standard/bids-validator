// Deno runtime tests for tests/data/valid_filenames
import { assert, assertEquals } from '../../deps/asserts.ts'
import { validatePath } from './common.ts'

const PATH = 'tests/data/valid_filenames'

Deno.test('valid_filenames dataset', async (t) => {
  const { tree, result } = await validatePath(t, PATH)

  await t.step('correctly ignores .bidsignore files', () => {
    assert(
      result.issues.get('NOT_INCLUDED') === undefined,
      'NOT_INCLUDED error should not be present',
    )
  })
})

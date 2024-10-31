// Deno runtime tests for tests/data/valid_filenames
import { assertEquals } from '@std/assert'
import { formatAssertIssue, validatePath } from './common.ts'

const PATH = 'tests/data/valid_filenames'

Deno.test('valid_filenames dataset', async (t) => {
  const { tree, result } = await validatePath(t, PATH)

  await t.step('correctly ignores .bidsignore files', () => {
    assertEquals(
      result.issues.get({ code: 'NOT_INCLUDED' }).length,
      0,
      formatAssertIssue(
        'NOT_INCLUDED should not be present',
        result.issues.get({ code: 'NOT_INCLUDED' }),
      ),
    )
  })
})

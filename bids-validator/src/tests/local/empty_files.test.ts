// Deno runtime tests for tests/data/empty_files
import { type assert, assertEquals, type assertObjectMatch } from '@std/assert'
import { formatAssertIssue, validatePath } from './common.ts'

const PATH = 'tests/data/empty_files'

/**
 * Contains stripped down CTF format dataset: Both, BadChannels and
 * bad.segments files can be empty and still valid. Everything else must
 * not be empty.
 */
Deno.test('empty_files dataset', async (t) => {
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

  // *.meg4 and BadChannels files are empty. But only *.meg4 is an issue
  /*
   * https://github.com/bids-standard/bids-validator/issues/1862
   * Commented out meat of tests, and updated first test to expect no issues.
   */
  await t.step(
    'EMPTY_FILES error is thrown for only sub-0001_task-AEF_run-01_meg.meg4',
    () => {
      const issues = result.issues.get({ code: 'EMPTY_FILE' })
      assertEquals(
        issues.length,
        1,
        'sub-0001_task-AEF_run-01_meg.ds/ is empty but not present in EMPTY_FILE issue',
      )
      assertEquals(issues[0].location, '/sub-0001/meg/sub-0001_task-AEF_run-01_meg.ds/')
    },
  )
})

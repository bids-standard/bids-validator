import {
  assertArrayIncludes,
  assertInstanceOf,
  assertObjectMatch,
  assertRejects,
} from '@std/assert'
import { IssueError } from '../issues/datasetIssues.ts'
import { BIDSFileDeno } from './deno.ts'

export function testAsyncFileAccess(
  name: string,
  // deno-lint-ignore no-explicit-any
  fn: (file: BIDSFileDeno, ...args: any[]) => Promise<any>,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) {
  Deno.test({
    name,
    ignore: Deno.build.os === 'windows',
    async fn(t) {
      await t.step('Dangling symlink', async () => {
        const file = new BIDSFileDeno('tests/data', '/broken-symlink')
        const e = await assertRejects(() => fn(file, ...args), IssueError)
        assertObjectMatch(e.issue, { code: 'FILE_READ', location: '/broken-symlink' })
        assertArrayIncludes(['NotFound', 'FilesystemLoop'], [e.issue.subCode])
        assertInstanceOf(e.cause, Error)
      })
      await t.step('Insufficient permissions', async () => {
        const tmpfile = await Deno.makeTempFile()
        await Deno.chmod(tmpfile, 0o000)
        const file = new BIDSFileDeno('', tmpfile)
        const e = await assertRejects(() => fn(file, ...args), IssueError)
        assertObjectMatch(e.issue, { code: 'FILE_READ', subCode: 'PermissionDenied' })
        assertInstanceOf(e.cause, Error)
      })
    },
  })
}

import {
  assertArrayIncludes,
  assertInstanceOf,
  assertObjectMatch,
  assertRejects,
  assertStrictEquals,
} from '@std/assert'
import { IssueError } from '../issues/datasetIssues.ts'
import { BIDSFile } from '../types/filetree.ts'
import { openStream, readBytes, readText } from './access.ts'
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

Deno.test('openers can reject with a finished issue', async (t) => {
  const path = '/sub-01/anat/sub-01_T1w.nii.gz'
  const readers: [string, (file: BIDSFile) => Promise<unknown>][] = [
    ['openStream', (file) => openStream(file)],
    ['readBytes', (file) => readBytes(file, 1)],
    ['readText', (file) => readText(file)],
  ]
  const fileRejecting = (rejection: IssueError) =>
    new BIDSFile(path, {
      size: 0,
      stream: () => Promise.reject(rejection),
      text: () => Promise.reject(rejection),
      readBytes: () => Promise.reject(rejection),
    })

  // readBytes and readText memoize by path, so each step starts with an empty cache.
  const clearCaches = () => {
    readBytes.cache.clear()
    readText.cache.clear()
  }

  for (const [name, read] of readers) {
    await t.step(`${name}: location is added when unset`, async () => {
      clearCaches()
      const rejection = new IssueError({ code: 'JSON_INVALID' })
      const e = await assertRejects(() => read(fileRejecting(rejection)), IssueError)
      assertStrictEquals(e, rejection)
      assertObjectMatch(e.issue, { code: 'JSON_INVALID', location: path })
    })
    await t.step(`${name}: a set location is kept`, async () => {
      clearCaches()
      const rejection = new IssueError({ code: 'JSON_INVALID', location: '/elsewhere' })
      const e = await assertRejects(() => read(fileRejecting(rejection)), IssueError)
      assertStrictEquals(e.issue.location, '/elsewhere')
    })
  }
  clearCaches()
})

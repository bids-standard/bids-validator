import { assert, assertArrayIncludes, assertObjectMatch } from '@std/assert'
import { basename, dirname } from '@std/path'
import { BIDSFileDeno } from './deno.ts'

export function testAsyncFileAccess(
  name: string,
  fn: (file: BIDSFileDeno, ...args: any[]) => Promise<any>,
  ...args: any[]
) {
  Deno.test({
    name,
    ignore: Deno.build.os === 'windows',
    async fn(t) {
      await t.step('Dangling symlink', async () => {
        const file = new BIDSFileDeno('tests/data', '/broken-symlink')
        try {
          await fn(file, ...args)
          assert(false, 'Expected error')
        } catch (e: any) {
          assertObjectMatch(e, {
            code: 'FILE_READ',
            location: '/broken-symlink',
          })
          assertArrayIncludes(['NotFound', 'FilesystemLoop'], [e.subCode])
        }
      })
      await t.step('Insufficient permissions', async () => {
        const tmpfile = await Deno.makeTempFile()
        await Deno.chmod(tmpfile, 0o000)
        const file = new BIDSFileDeno('', tmpfile)
        try {
          await fn(file, ...args)
          assert(false, 'Expected error')
        } catch (e: any) {
          assertObjectMatch(e, { code: 'FILE_READ', subCode: 'PermissionDenied' })
        }
      })
    },
  })
}

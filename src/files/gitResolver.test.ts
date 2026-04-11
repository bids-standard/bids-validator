import { assertEquals } from '@std/assert'
import type { ResolveVerdict, TreeSource } from './gitResolver.ts'

Deno.test('gitResolver: ResolveVerdict union includes every kind', () => {
  const source: TreeSource = {
    commitOid: 'abcdef0123456789',
    // deno-lint-ignore no-explicit-any
    gitOptions: { fs: {}, gitdir: '/tmp/fake.git', cache: {} } as any,
    symlinkMap: new Map(),
  }
  // Type checks
  const verdicts: ResolveVerdict[] = [
    { kind: 'file-blob', oid: 'x', size: 1, source },
    { kind: 'annex', key: 'k', size: 2, source },
    { kind: 'tree', treePath: 'p', originalDir: 'd', source },
    { kind: 'submodule-boundary', mountPath: 'sub', remainder: 'path', source },
    { kind: 'unresolved', reason: 'broken' },
  ]
  assertEquals(verdicts.length, 5)
})

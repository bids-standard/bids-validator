import { assertEquals } from '@std/assert'
import { join } from '@std/path'
import type { ResolveVerdict, TreeSource } from './gitResolver.ts'
import * as posix from '@std/path/posix'
import { findSubmoduleAncestor } from './gitResolver.ts'
import { hasGit, isWindows, withRepo } from './utils.test.ts'

type objType = 'tree' | 'blob' | 'commit'
const linkMode = '120000'

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

/**
 * Types and helpers for fake tree construction in tests.
 */
type TreeEntry = { path: string; type: objType; mode?: string }

type FakeEntry =
  | { type: 'tree'; object: TreeEntry[] }
  | { type: 'blob'; oid: string; object?: Uint8Array }
  | { type: 'commit' }

/** Spec for a single blob in the fake tree */
type ObjSpec = {
  type: objType
  path: string
  content: string
  mode?: string
}

/** Create a blob spec. Regular file if no mode; symlink if mode === linkMode */
function blob(path: string, content: string = 'content', mode?: string): ObjSpec {
  return { type: 'blob', path, content, mode }
}
function submodule(path: string): ObjSpec {
  return { type: 'commit', path, content: 'commit-hash' }
}

/**
 * Build a TreeSource from a flat list of blob specs. Auto-generates the full
 * tree hierarchy, oids (derived from paths), and byte arrays.
 */
function fakeTreeSource(objs: ObjSpec[]): TreeSource {
  const objects = new Map<string, FakeEntry>()
  const encoder = new TextEncoder()

  for (const obj of objs) {
    // Direct lookup
    if (obj.type === 'blob') {
      objects.set(
        obj.path,
        {
          type: 'blob' as const,
          oid: obj.path.replace(/[/.]/g, '-'),
          object: encoder.encode(obj.content),
        },
      )
    }

    // Populate parent trees
    let { dir, base } = posix.parse(obj.path)
    let child: TreeEntry = { path: base, type: obj.type, mode: obj.mode }
    if (dir == '.') dir = ''
    let parent = objects.get(dir) as Extract<FakeEntry, { type: 'tree' }> | undefined

    // Create tree entries for children
    while (!parent) {
      objects.set(dir, { type: 'tree' as const, object: [child] })
      ;({ dir, base } = posix.parse(dir))
      child = { path: base, type: 'tree' as const }
      if (dir == '.') dir = ''
      parent = objects.get(dir) as Extract<FakeEntry, { type: 'tree' }> | undefined
    }
    // Found existing tree, update with last-created entry
    parent.object.push(child)
  }

  // Build symlinkMap from blob specs annotated with linkMode
  const symlinkMap = new Map<string, string>()
  for (const { path, content } of objs.filter(({ mode }) => mode === linkMode)) {
    symlinkMap.set(path, content)
  }

  return {
    commitOid: 'fake-commit',
    // deno-lint-ignore no-explicit-any
    gitOptions: { fs: {}, gitdir: '/tmp/fake.git', cache: { __fake: objects } } as any,
    symlinkMap,
  }
}

Deno.test('findSubmoduleAncestor: returns null when no gitlink in prefix', async () => {
  const source = fakeTreeSource([
    blob('a/b/c'),
  ])
  const result = await findSubmoduleAncestor('a/b/missing', source)
  assertEquals(result, null)
})

Deno.test('findSubmoduleAncestor: returns the mount path when an ancestor is a gitlink', async () => {
  const source = fakeTreeSource([
    submodule('sub'),
  ])
  const result = await findSubmoduleAncestor('sub/inner/file.txt', source)
  assertEquals(result, { mountPath: 'sub', remainder: 'inner/file.txt' })
})

Deno.test('findSubmoduleAncestor: returns null when prefix walk hits a blob', async () => {
  const source = fakeTreeSource([
    blob('a'),
  ])
  const result = await findSubmoduleAncestor('a/b', source)
  assertEquals(result, null)
})

Deno.test(
  {
    name: 'findSubmoduleAncestor: smoke test against a real git repo (no fake)',
    ignore: !hasGit || isWindows,
    sanitizeResources: false,
    sanitizeOps: false,
  },
  async () => {
    await withRepo(
      async (repo) => {
        // Create a regular file at a/b/c.txt — NOT a submodule. The test
        // confirms that findSubmoduleAncestor correctly returns null and
        // does NOT throw a TypeError from the legacy tree-shape bug.
        await Deno.mkdir(join(repo, 'a', 'b'), { recursive: true })
        await Deno.writeTextFile(join(repo, 'a', 'b', 'c.txt'), 'content')
      },
      async (repo) => {
        // Resolve the HEAD commit OID so we use a real commit.
        const { default: git } = await import('isomorphic-git')
        const { default: fs } = await import('node:fs')
        const commitOid = await git.resolveRef({ fs, gitdir: join(repo, '.git'), ref: 'HEAD' })

        const source: TreeSource = {
          commitOid,
          // deno-lint-ignore no-explicit-any
          gitOptions: { fs, gitdir: join(repo, '.git'), cache: {} } as any,
          symlinkMap: new Map(),
        }

        // A path that exists but has no submodule ancestor — must return null
        // without throwing.
        const resultExisting = await findSubmoduleAncestor('a/b/c.txt', source)
        assertEquals(resultExisting, null)

        // A path under a missing directory — also must return null, not throw.
        const resultMissing = await findSubmoduleAncestor('a/nope/x.txt', source)
        assertEquals(resultMissing, null)
      },
    )
  },
)

import { assertEquals, assertExists } from '@std/assert'
import { join } from '@std/path'
import * as posix from '@std/path/posix'
import type { FollowBudget, ResolveVerdict, TreeSource } from './gitResolver.ts'
import { findSubmoduleAncestor, graftTree, resolveSymlink } from './gitResolver.ts'
import { FileIgnoreRules } from './ignore.ts'
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

function budget(n = 10): FollowBudget {
  return { remaining: n }
}

Deno.test('resolveSymlink: terminal file-blob resolves', async () => {
  const source = fakeTreeSource([
    blob('a/foo.txt'),
    blob('a/b/link', '../foo.txt', linkMode),
  ])

  const verdict = await resolveSymlink('a/b/link', '../foo.txt', source, budget())
  assertEquals(verdict.kind, 'file-blob')
  if (verdict.kind === 'file-blob') {
    assertEquals(verdict.oid, 'a-foo-txt')
  }
})

Deno.test('resolveSymlink: absolute target is out-of-tree', async () => {
  const source = fakeTreeSource([])
  const verdict = await resolveSymlink('link', '/etc/passwd', source, budget())
  assertEquals(verdict, { kind: 'unresolved', reason: 'out-of-tree' })
})

Deno.test('resolveSymlink: relative escape above root is out-of-tree', async () => {
  const source = fakeTreeSource([])
  const verdict = await resolveSymlink('a/link', '../../../etc/passwd', source, budget())
  assertEquals(verdict, { kind: 'unresolved', reason: 'out-of-tree' })
})

Deno.test('resolveSymlink: missing target is broken', async () => {
  const source = fakeTreeSource([
    blob('a/link', '../nowhere.txt', linkMode),
  ])
  const verdict = await resolveSymlink('a/link', '../nowhere.txt', source, budget())
  assertEquals(verdict, { kind: 'unresolved', reason: 'broken' })
})

Deno.test('resolveSymlink: terminal tree returns a tree verdict', async () => {
  const source = fakeTreeSource([
    blob('real/.gitkeep', ''),
    blob('linkdir', 'real/', linkMode),
  ])
  const verdict = await resolveSymlink('linkdir', 'real/', source, budget())
  assertEquals(verdict.kind, 'tree')
  if (verdict.kind === 'tree') {
    assertEquals(verdict.treePath, 'real')
    assertEquals(verdict.originalDir, '')
  }
})

Deno.test('resolveSymlink: follows a chain of file symlinks', async () => {
  const source = fakeTreeSource([
    blob('a', 'b', linkMode),
    blob('b', 'c', linkMode),
    blob('c', 'real.txt', linkMode),
    blob('real.txt'),
  ])
  const verdict = await resolveSymlink('a', 'b', source, budget())
  assertEquals(verdict.kind, 'file-blob')
  if (verdict.kind === 'file-blob') {
    assertEquals(verdict.oid, 'real-txt')
  }
})

Deno.test('resolveSymlink: terminal chain resolving to an annex key', async () => {
  const annexKey = 'MD5E-s1234--d41d8cd98f00b204e9800998ecf8427e.nii.gz'
  const annexTarget = `../.git/annex/objects/xx/yy/${annexKey}/${annexKey}`
  const source = fakeTreeSource([
    blob('link', annexTarget, linkMode),
    blob('alias', 'link', linkMode),
  ])
  const verdict = await resolveSymlink('alias', 'link', source, budget())
  assertEquals(verdict.kind, 'annex')
  if (verdict.kind === 'annex') {
    assertEquals(verdict.key, annexKey)
    assertEquals(verdict.size, 1234)
  }
})

Deno.test('resolveSymlink: follows intermediate directory symlink during segment walk', async () => {
  // Layout (Unix physical-path semantics):
  //   a/c is a symlink to "../d/e/" (escapes 'a/' to root, then into d/e/)
  //   a/b/link is a symlink to "../c/file" (pops to 'a', resolves 'a/c' then 'file')
  //   d/e/file is a regular blob with content
  const source = fakeTreeSource([
    blob('a/b/link', '../c/file', linkMode),
    blob('a/c', '../d/e/', linkMode),
    blob('d/e/file'),
  ])

  const verdict = await resolveSymlink('a/b/link', '../c/file', source, budget())
  assertEquals(verdict.kind, 'file-blob')
  if (verdict.kind === 'file-blob') {
    assertEquals(verdict.oid, 'd-e-file')
  }
})

Deno.test('resolveSymlink: budget exhaustion returns cycle', async () => {
  // Build a chain of 12 symlinks all pointing to the next (link0..link11 are
  // symlinks, link12 is the terminal blob). Starting at target 'link1' means
  // the resolver needs 11 follows to reach link12 — budget of 10 trips.
  const objs: ObjSpec[] = []
  for (let i = 0; i < 13; i++) {
    const name = `link${i}`
    if (i < 12) {
      objs.push(blob(name, `link${i + 1}`, linkMode))
    } else {
      objs.push(blob(name, 'terminal'))
    }
  }
  const source = fakeTreeSource(objs)
  const verdict = await resolveSymlink('link0', 'link1', source, budget(10))
  assertEquals(verdict, { kind: 'unresolved', reason: 'cycle' })
})

Deno.test('resolveSymlink: mutual cycle a <-> b returns cycle', async () => {
  const source = fakeTreeSource([
    blob('a', 'b', linkMode),
    blob('b', 'a', linkMode),
  ])
  const verdict = await resolveSymlink('a', 'b', source, budget())
  assertEquals(verdict, { kind: 'unresolved', reason: 'cycle' })
})

function treeVerdict(
  treePath: string,
  originalDir: string,
  source: TreeSource,
): Extract<ResolveVerdict, { kind: 'tree' }> {
  return { kind: 'tree', treePath, originalDir, source }
}

Deno.test('graftTree: grafts a flat directory', async () => {
  const source = fakeTreeSource([
    blob('target/a.txt'),
    blob('target/b.txt'),
    blob('view', 'target/', linkMode),
  ])
  const verdict = treeVerdict('target', '', source)

  const result = await graftTree('/view', verdict, budget(), new Set())
  const paths = result.files.map((f) => f.path).sort()
  assertEquals(paths, ['/view/a.txt', '/view/b.txt'])
  assertEquals(result.links, [])
})

Deno.test('graftTree: recurses into nested directories', async () => {
  const source = fakeTreeSource([
    blob('target/top.txt'),
    blob('target/sub/deep.txt'),
    blob('view', 'target/', linkMode),
  ])
  const verdict = treeVerdict('target', '', source)

  const result = await graftTree('/view', verdict, budget(), new Set())
  const paths = result.files.map((f) => f.path).sort()
  assertEquals(paths, ['/view/sub/deep.txt', '/view/top.txt'])
})

Deno.test('graftTree: emits cycle at graftPath when visited set already contains it', async () => {
  const source = fakeTreeSource([])
  const verdict = treeVerdict('target', '', source)
  const visited = new Set<string>(['/view'])

  const result = await graftTree('/view', verdict, budget(), visited)
  assertEquals(result.files, [])
  assertEquals(result.links.length, 1)
  assertEquals(result.links[0].path, '/view')
  assertEquals(result.links[0].reason, 'cycle')
})

Deno.test('graftTree: respects prune at the grafted path', async () => {
  const source = fakeTreeSource([
    blob('target/keep.txt'),
    blob('target/skip.txt'),
  ])
  const verdict = treeVerdict('target', '', source)
  const prune = new FileIgnoreRules(['/view/skip.txt'])

  const result = await graftTree('/view', verdict, budget(), new Set(), prune)
  const paths = result.files.map((f) => f.path).sort()
  assertEquals(paths, ['/view/keep.txt'])
})

Deno.test('graftTree: grafts nested file symlink with original-location semantics', async () => {
  // /target/link.txt is a symlink to "../foo.txt"
  // Under Unix physical-path rules, that resolves to /foo.txt, not /view/foo.txt.
  const source = fakeTreeSource([
    blob('foo.txt'),
    blob('target/link.txt', '../foo.txt', linkMode),
    blob('view', 'target/', linkMode),
  ])
  const verdict = treeVerdict('target', '', source)

  const result = await graftTree('/view', verdict, budget(), new Set())
  const paths = result.files.map((f) => f.path).sort()
  assertEquals(paths, ['/view/link.txt'])
  // The grafted file's opener points at foo.txt's oid — assert via the internal
  // opener structure. GitFileOpener stores `oid` as a public property.
  const grafted = result.files.find((f) => f.path === '/view/link.txt')
  assertExists(grafted)
  // deno-lint-ignore no-explicit-any
  assertEquals((grafted.opener as any).oid, 'foo-txt')
})

Deno.test('graftTree: mutual dir symlinks a<->b produce no files and a cycle link', async () => {
  const source = fakeTreeSource([
    blob('a', 'b/', linkMode),
    blob('b', 'a/', linkMode),
  ])
  const verdict = await resolveSymlink('a', 'b/', source, budget())
  assertEquals(verdict, { kind: 'unresolved', reason: 'cycle' })
})

Deno.test('graftTree: dir symlink back into ancestor produces finite recursion', async () => {
  const source = fakeTreeSource([
    blob('a', 'd/', linkMode),
    blob('d/sub', '../a/', linkMode),
    blob('d/file.txt'),
  ])
  const b = budget(10)
  const topVerdict = await resolveSymlink('a', 'd/', source, b)
  assertEquals(topVerdict.kind, 'tree')
  if (topVerdict.kind !== 'tree') return

  const result = await graftTree('/a', topVerdict, b, new Set())
  // We should see a finite number of /a/file.txt entries (one per recursion
  // level reached before the budget ran out) plus at least one cycle link.
  const fileTxtPaths = result.files
    .map((f) => f.path)
    .filter((p) => p.endsWith('/file.txt'))
  assertEquals(fileTxtPaths.length > 0, true, 'expected at least one grafted file')
  const cycleLinks = result.links.filter((l) => l.reason === 'cycle')
  assertEquals(cycleLinks.length > 0, true, 'expected at least one cycle link')
  // Sanity: recursion terminates.
  assertEquals(result.files.length < 1000, true, 'recursion did not terminate')
})

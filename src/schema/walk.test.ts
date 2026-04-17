import { assert, assertEquals } from '@std/assert'
import { BIDSContext, BIDSContextDataset } from './context.ts'
import { walkFileTree } from './walk.ts'
import { simpleDataset, simpleDatasetFileCount } from '../tests/simple-dataset.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import type { UnresolvedLink } from '../types/filetree.ts'
import { FileTree } from '../types/filetree.ts'
import { FileIgnoreRules } from '../files/ignore.ts'

// Helper: build a minimal BIDSContextDataset wrapping a tree.
function datasetFor(tree: FileTree): BIDSContextDataset {
  return new BIDSContextDataset({ tree })
}

Deno.test('file tree walking', async (t) => {
  const schema = await loadSchema()
  await t.step('visits each file and creates a BIDSContext', async () => {
    const dsContext = new BIDSContextDataset({ tree: simpleDataset, schema: schema })
    for await (const context of walkFileTree(dsContext)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
    }
  })
  await t.step('visits every file expected', async () => {
    const dsContext = new BIDSContextDataset({ tree: simpleDataset, schema: schema })
    let accumulator = 0
    for await (const context of walkFileTree(dsContext)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
      if (!context.directory) {
        accumulator = accumulator + 1
      }
    }
    assertEquals(
      accumulator,
      simpleDatasetFileCount,
      'visited file count does not match expected value',
    )
  })
  await t.step('produces context for opaque directory', async () => {
    simpleDataset.directories.push(pathsToTree(['/code/code.sh']).directories[0])
    const dsContext = new BIDSContextDataset({ tree: simpleDataset, schema: schema })
    let accumulator = 0
    for await (const context of walkFileTree(dsContext)) {
      assert(
        context instanceof BIDSContext,
        'walk file tree did not return a BIDSContext',
      )
      if (!context.directory || context.file.name === 'code/') {
        accumulator = accumulator + 1
      }
    }
    assertEquals(
      accumulator,
      simpleDatasetFileCount + 1,
      'visited file count does not match expected value',
    )
  })
})

Deno.test('walkFileTree emits SYMLINK_BROKEN for a broken link', async () => {
  const tree = new FileTree('/', '/')
  tree.links.push({ path: '/broken', target: '../nope', reason: 'broken' })
  const ds = datasetFor(tree)

  // Drain the walker so link issues are emitted.
  for await (const _ of walkFileTree(ds)) { /* consume */ }

  const symlinkIssues = ds.issues.get({ code: 'SYMLINK_BROKEN' })
  assertEquals(symlinkIssues.length, 1)
  assertEquals(symlinkIssues[0].location, '/broken')
})

Deno.test('walkFileTree honours .bidsignore when reporting links', async () => {
  const rules = new FileIgnoreRules(['ignored/**'])
  const tree = new FileTree('/', '/', undefined, rules)
  tree.links.push({ path: '/ignored/broken', target: '../nope', reason: 'broken' })
  const ds = datasetFor(tree)

  for await (const _ of walkFileTree(ds)) { /* consume */ }

  assertEquals(ds.issues.get({ code: 'SYMLINK_BROKEN' }).length, 0)
})

Deno.test('walkFileTree emits one issue per link with the correct code', async () => {
  const tree = new FileTree('/', '/')
  const cases: UnresolvedLink[] = [
    { path: '/a', target: 't1', reason: 'broken' },
    { path: '/b', target: 't2', reason: 'cycle' },
    { path: '/c', target: 't3', reason: 'out-of-tree' },
    { path: '/d', target: 't4', reason: 'submodule' },
    { path: '/e', target: 't5', reason: 'directory-unsupported' },
  ]
  for (const link of cases) tree.links.push(link)
  const ds = datasetFor(tree)

  for await (const _ of walkFileTree(ds)) { /* consume */ }

  assertEquals(ds.issues.get({ code: 'SYMLINK_BROKEN' }).length, 1)
  assertEquals(ds.issues.get({ code: 'SYMLINK_CYCLE' }).length, 1)
  assertEquals(ds.issues.get({ code: 'SYMLINK_OUT_OF_TREE' }).length, 1)
  assertEquals(ds.issues.get({ code: 'SYMLINK_IN_SUBMODULE' }).length, 1)
  assertEquals(ds.issues.get({ code: 'SYMLINK_DIRECTORY_UNSUPPORTED' }).length, 1)
})

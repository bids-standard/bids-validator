import { assert, assertEquals } from '@std/assert'
import { FileIgnoreRules } from './ignore.ts'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { filesToTree, subtree } from './filetree.ts'
import { NullFileOpener } from './openers.ts'
import { StringOpener } from './openers.test.ts'

export function pathToFile(path: string, ignored: boolean = false): BIDSFile {
  return new BIDSFile(path, new StringOpener(''), ignored)
}

export function pathsToTree(paths: string[], ignore?: string[]): FileTree {
  const ignoreRules = new FileIgnoreRules(ignore ?? [])
  return filesToTree(paths.map((path) => pathToFile(path, ignoreRules.test(path))))
}

Deno.test('FileTree generation', async (t) => {
  await t.step('converts a basic list', () => {
    const tree = pathsToTree(['/dataset_description.json', '/README.md'])
    assertEquals(tree.directories, [])
    assertEquals(tree.files.map((f) => f.name), ['dataset_description.json', 'README.md'])
  })

  await t.step('converts a simple list with several levels', () => {
    const tree = pathsToTree([
      '/dataset_description.json',
      '/participants.tsv',
      '/README.md',
      '/sub-01/anat/sub-01_T1w.nii.gz',
    ])

    assertEquals(tree.directories.map((d) => d.name), ['sub-01'])

    const sub01 = tree.directories[0]
    assertEquals(sub01.path, '/sub-01')
    assertEquals(sub01.parent, tree)
    assertEquals(sub01.directories.map((d) => d.name), ['anat'])

    const anat = sub01.directories[0]
    assertEquals(anat.path, '/sub-01/anat')
    assertEquals(anat.parent, sub01)
    assertEquals(anat.files.map((f) => f.name), ['sub-01_T1w.nii.gz'])

    const t1w = anat.files[0]
    assertEquals(t1w.path, '/sub-01/anat/sub-01_T1w.nii.gz')
    assertEquals(t1w.parent, anat)

    assertEquals(tree.files.map((f) => f.name), [
      'dataset_description.json',
      'participants.tsv',
      'README.md',
    ])
    assertEquals(tree.files.map((f) => f.path), [
      '/dataset_description.json',
      '/participants.tsv',
      '/README.md',
    ])
    assertEquals(tree.files.map((f) => f.parent), [tree, tree, tree])

    assert(tree.contains(['sub-01']))
    assert(tree.contains(['sub-01', 'anat']))
    assert(tree.contains(['sub-01', 'anat', 'sub-01_T1w.nii.gz']))
  })
  await t.step('converts a list with ignores', () => {
    const tree = pathsToTree(
      ['/dataset_description.json', '/README.md', '/.bidsignore', '/bad_file'],
      ['bad_file'],
    )
    assertEquals(tree.directories, [])
    assertEquals(tree.files.map((f) => f.name), [
      'dataset_description.json',
      'README.md',
      '.bidsignore',
      'bad_file',
    ])
    const bad_file = tree.get('bad_file') as BIDSFile
    assert(bad_file.ignored)
  })
})

Deno.test('extract subtrees', async (t) => {
  await t.step('Successfully re-roots derivatives', async () => {
    const tree = pathsToTree([
      '/dataset_description.json',
      '/sub-01/anat/sub-01_T1w.nii.gz',
      '/derivatives/pipeline/dataset_description.json',
      '/derivatives/pipeline/sub-01/anat/sub-01_desc-preproc_T1w.nii.gz',
    ])
    assertEquals(tree.directories.map((d) => d.name), ['sub-01', 'derivatives'])
    assertEquals(tree.files.map((f) => f.name), ['dataset_description.json'])

    const pipeline = tree.get('derivatives/pipeline') as FileTree
    assertEquals(pipeline.path, '/derivatives/pipeline')
    assertEquals(pipeline.directories.map((d) => d.path), ['/derivatives/pipeline/sub-01'])
    assertEquals(pipeline.files.map((f) => f.path), [
      '/derivatives/pipeline/dataset_description.json',
    ])

    const derivTree = await subtree(pipeline)
    assertEquals(derivTree.path, '/')
    assertEquals(derivTree.directories.map((d) => d.path), ['/sub-01'])
    assertEquals(derivTree.files.map((f) => f.path), ['/dataset_description.json'])
    assertEquals(
      derivTree.get('sub-01/anat/sub-01_desc-preproc_T1w.nii.gz')!.path,
      '/sub-01/anat/sub-01_desc-preproc_T1w.nii.gz',
    )
  })

  await t.step('Subtree uses new bidsignore', async () => {
    const tree = pathsToTree([
      '/dataset_description.json',
      '/.bidsignore',
      '/ignored_file',
      '/derivatives/pipeline/dataset_description.json',
      '/derivatives/pipeline/.bidsignore',
      '/derivatives/pipeline/ignored_file',
      '/derivatives/pipeline/also_ignored_file',
    ], ['ignored_file'])
    const subignore = tree.get('derivatives/pipeline/.bidsignore') as BIDSFile
    subignore.opener = new StringOpener('also_ignored_file\n')

    assertEquals(tree.get('ignored_file')!.ignored, true)
    assertEquals(tree.get('derivatives/pipeline/also_ignored_file')!.ignored, false)

    const pipeline = await subtree(tree.get('derivatives/pipeline') as FileTree)
    assertEquals(pipeline.get('also_ignored_file')!.ignored, true)
    assertEquals(pipeline.get('ignored_file')!.ignored, false)
  })
})

Deno.test('FileTree initialises an empty links array', () => {
  const tree = new FileTree('/some/path', 'path')
  assertEquals(tree.links, [])
})

Deno.test('FileTree.links accepts UnresolvedLink records', () => {
  const tree = new FileTree('/some/path', 'path')
  tree.links.push({
    path: '/some/path/broken',
    target: '../does-not-exist',
    reason: 'broken',
  })
  assertEquals(tree.links.length, 1)
  assertEquals(tree.links[0].reason, 'broken')
})

Deno.test('FileTree.isPathIgnored delegates to its FileIgnoreRules', () => {
  const rules = new FileIgnoreRules(['/ignored/**'])
  const tree = new FileTree('/', '/', undefined, rules)
  assertEquals(tree.isPathIgnored('/ignored/foo.txt'), true)
  assertEquals(tree.isPathIgnored('/kept/bar.txt'), false)
})

Deno.test('filesToTree attaches unresolved links to their parent directory', () => {
  const file = new BIDSFile('/sub-01/anat/sub-01_T1w.json', new NullFileOpener(0))
  const tree = filesToTree([file], undefined, [
    {
      path: '/sub-01/anat/broken.nii.gz',
      target: '../nope.nii.gz',
      reason: 'broken',
    },
  ])

  const anat = tree.get('sub-01/anat')
  assert(anat !== undefined, 'sub-01/anat should exist in tree')
  assertEquals((anat as FileTree).links.length, 1)
  assertEquals((anat as FileTree).links[0].path, '/sub-01/anat/broken.nii.gz')
})

Deno.test('filesToTree creates intermediate directories for a link-only path', () => {
  const tree = filesToTree([], undefined, [
    {
      path: '/a/b/c/dangling.txt',
      target: 'nowhere',
      reason: 'broken',
    },
  ])
  const c = tree.get('a/b/c')
  assert(c !== undefined, '/a/b/c should be created for the link')
  assertEquals((c as FileTree).links.length, 1)
})

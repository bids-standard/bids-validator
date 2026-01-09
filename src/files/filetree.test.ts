import { assert, assertEquals } from '@std/assert'
import { FileIgnoreRules } from './ignore.ts'
import { BIDSFile, type FileOpener, type FileTree } from '../types/filetree.ts'
import { filesToTree, subtree } from './filetree.ts'
import { StringOpener } from './openers.test.ts'

export function pathToFile(path: string, ignored: boolean = false): BIDSFile {
  const name = path.split('/').pop() as string
  return new BIDSFile(path, new StringOpener(''), ignored)
}

export function pathsToTree(paths: string[], ignore?: string[]): FileTree {
  const ignoreRules = new FileIgnoreRules(ignore ?? [])
  return filesToTree(paths.map((path) => pathToFile(path, ignoreRules.test(path))))
}

Deno.test('FileTree generation', async (t) => {
  await t.step('converts a basic list', async () => {
    const tree = pathsToTree(['/dataset_description.json', '/README.md'])
    assertEquals(tree.directories, [])
    assertEquals(tree.files.map((f) => f.name), ['dataset_description.json', 'README.md'])
  })

  await t.step('converts a simple list with several levels', async () => {
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
  await t.step('converts a list with ignores', async () => {
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

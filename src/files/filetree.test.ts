import { assert, assertEquals } from '@std/assert'
import { FileIgnoreRules } from './ignore.ts'
import { BIDSFile, type FileOpener, type FileTree } from '../types/filetree.ts'
import { filesToTree } from './filetree.ts'
import { asyncStreamFromString } from '../tests/utils.ts'

class NullFileOpener implements FileOpener {
  size = 0
  stream = () => asyncStreamFromString('')
  text = () => Promise.resolve('')
  readBytes = async (size: number, offset?: number) => new Uint8Array()
}

export function pathToFile(path: string, ignored: boolean = false): BIDSFile {
  const name = path.split('/').pop() as string
  return new BIDSFile(path, new NullFileOpener(), ignored)
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

import { FileIgnoreRules } from './ignore.ts'
import { FileTree } from '../types/filetree.ts'
import { assertEquals, assertObjectMatch } from '@std/assert'
import { BIDSFileBrowser, fileListToTree } from './browser.ts'
import { streamFromString } from '../tests/utils.ts'

const nullstream = streamFromString('')

class TestFile extends File {
  override webkitRelativePath: string
  constructor(
    fileBits: BlobPart[],
    fileName: string,
    webkitRelativePath: string,
    options?: FilePropertyBag | undefined,
  ) {
    super(fileBits, fileName, options)
    this.webkitRelativePath = webkitRelativePath
    this.stream = () => nullstream
  }
}

Deno.test('Browser implementation of FileTree', async (t) => {
  await t.step('converts a basic FileList', async () => {
    const ignore = new FileIgnoreRules([])
    const files = [
      new TestFile(
        ['{}'],
        'dataset_description.json',
        'ds/dataset_description.json',
      ),
      new TestFile(['flat test dataset'], 'README.md', 'ds/README.md'),
    ]
    const tree = await fileListToTree(files)
    const expectedTree = new FileTree('/', '/', undefined)
    expectedTree.files = files.map((f) => {
      const file = new BIDSFileBrowser(f, ignore)
      file.parent = expectedTree
      return file
    })
    assertEquals(tree, expectedTree)
  })
  await t.step('converts a simple FileList with several levels', async () => {
    const ignore = new FileIgnoreRules([])
    const files = [
      new TestFile(
        ['{}'],
        'dataset_description.json',
        'ds/dataset_description.json',
      ),
      new TestFile(
        ['tsv headers\n', 'column\tdata'],
        'participants.tsv',
        'ds/participants.tsv',
      ),
      new TestFile(
        ['single subject test dataset'],
        'README.md',
        'ds/README.md',
      ),
      new TestFile(
        ['nifti file goes here'],
        'sub-01_T1w.nii.gz',
        'ds/sub-01/anat/sub-01_T1w.nii.gz',
      ),
    ]
    const tree = await fileListToTree(files)
    const expectedTree = new FileTree('/', '/', undefined)
    const sub01Tree = new FileTree('/sub-01', 'sub-01', expectedTree)
    const anatTree = new FileTree('/sub-01/anat', 'anat', sub01Tree)
    expectedTree.files = files
      .slice(0, 3)
      .map((f) => {
        const file = new BIDSFileBrowser(f, ignore)
        file.parent = expectedTree
        return file
      })
    expectedTree.directories.push(sub01Tree)
    anatTree.files = [new BIDSFileBrowser(files[3], ignore)]
    anatTree.files[0].parent = anatTree
    sub01Tree.directories.push(anatTree)
    assertEquals(tree, expectedTree)
  })

  await t.step('reads .bidsignore during load', async () => {
    const ignore = new FileIgnoreRules(['ignored_but_absent', 'ignored_and_present'])
    const files = [
      new TestFile(
        ['ignored_but_absent\n', 'ignored_and_present\n'],
        '.bidsignore',
        'ds/.bidsignore',
      ),
      new TestFile(
        ['{}'],
        'dataset_description.json',
        'ds/dataset_description.json',
      ),
      new TestFile(
        ['tsv headers\n', 'column\tdata'],
        'participants.tsv',
        'ds/participants.tsv',
      ),
      new TestFile(
        ['single subject test dataset'],
        'README.md',
        'ds/README.md',
      ),
      new TestFile(
        ['Anything can be in an ignored file'],
        'ignored_and_present',
        'ds/ignored_and_present',
      ),
      new TestFile(
        ['nifti file goes here'],
        'sub-01_T1w.nii.gz',
        'ds/sub-01/anat/sub-01_T1w.nii.gz',
      ),
    ]
    const tree = await fileListToTree(files)
    const expectedTree = new FileTree('/', '/', undefined)
    const sub01Tree = new FileTree('/sub-01', 'sub-01', expectedTree)
    const anatTree = new FileTree('/sub-01/anat', 'anat', sub01Tree)
    expectedTree.files = files
      .slice(0, 5)
      .map((f) => {
        const file = new BIDSFileBrowser(f, ignore)
        file.parent = expectedTree
        return file
      })
    expectedTree.directories.push(sub01Tree)
    anatTree.files = [new BIDSFileBrowser(files[5], ignore)]
    anatTree.files[0].parent = anatTree
    sub01Tree.directories.push(anatTree)
    assertEquals(tree, expectedTree)

    assertEquals(tree.get('ignored_and_present')?.ignored, true)
  })
})

Deno.test('Spread copies of BIDSFileBrowser contain name and path properties', async () => {
  const ignore = new FileIgnoreRules([])
  const files = [
    new TestFile(
      ['{}'],
      'dataset_description.json',
      'ds/dataset_description.json',
    ),
    new TestFile(['flat test dataset'], 'README.md', 'ds/README.md'),
  ]
  const tree = await fileListToTree(files)
  const expectedTree = new FileTree('/', '/', undefined)
  expectedTree.files = files.map((f) => {
    const file = new BIDSFileBrowser(f, ignore)
    file.parent = expectedTree
    return file
  })
  assertEquals(tree, expectedTree)
  const spreadFile = { ...expectedTree.files[0], evidence: 'test evidence' }
  assertObjectMatch(spreadFile, {
    name: 'dataset_description.json',
    path: '/dataset_description.json',
    evidence: 'test evidence',
  })
})

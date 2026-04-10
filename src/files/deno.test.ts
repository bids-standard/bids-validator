import { assert, assertEquals, assertRejects } from '@std/assert'
import { readAll, readerFromStreamReader } from '@std/io'
import { basename, dirname, fromFileUrl, join } from '@std/path'
import { EOL } from '@std/fs'
import type { FileTree } from '../types/filetree.ts'
import { BIDSFileDeno, readFileTree } from './deno.ts'
import { UnicodeDecodeError } from './streams.ts'
import { requestReadPermission } from '../setup/requestPermissions.ts'
import { FileIgnoreRules } from './ignore.ts'

await requestReadPermission()

// Use this file for testing file behavior
const testUrl = import.meta.url
const testPath = fromFileUrl(testUrl)
const testDir = dirname(testPath) // $REPO/src/files
const testFilename = basename(testPath)
const repoRoot = dirname(dirname(dirname(testPath)))
const ignore = new FileIgnoreRules([])
const prune = new FileIgnoreRules(['derivatives'], false)

Deno.test('Deno implementation of BIDSFile', async (t) => {
  await t.step('implements basic file properties', () => {
    const file = new BIDSFileDeno(testDir, testFilename, ignore)
    assertEquals(join(testDir, file.path), testPath)
  })
  await t.step('implements correct file size', async () => {
    const { size } = await Deno.stat(testPath)
    const file = new BIDSFileDeno(testDir, testFilename, ignore)
    assertEquals(await file.size, size)
  })
  await t.step('can be read as ReadableStream', async () => {
    const file = new BIDSFileDeno(testDir, testFilename, ignore)
    const stream = await file.stream()
    const streamReader = stream.getReader()
    const denoReader = readerFromStreamReader(streamReader)
    const fileBuffer = await readAll(denoReader)
    assertEquals(await file.size, fileBuffer.length)
  })
  await t.step('can be read with .text() method', async () => {
    const file = new BIDSFileDeno(testDir, testFilename, ignore)
    const text = await file.text()
    assertEquals(await file.size, text.length)
  })
  await t.step(
    'throws UnicodeDecodeError when reading a UTF-16 file with text() method',
    async () => {
      // BOM is invalid in JSON but shows up often from certain tools, so abstract handling it
      const bomDir = join(testPath, '..', '..', 'tests')
      const bomFilename = 'bom-utf16.tsv'
      const file = new BIDSFileDeno(bomDir, bomFilename, ignore)
      await assertRejects(() => file.text(), UnicodeDecodeError)
    },
  )
  await t.step(
    'strips BOM characters when reading UTF-8 via .text()',
    async () => {
      // BOM is invalid in JSON but shows up often from certain tools, so abstract handling it
      const bomDir = join(repoRoot, 'src', 'tests')
      const bomFilename = 'bom-utf8.json'
      const file = new BIDSFileDeno(bomDir, bomFilename, ignore)
      const text = await file.text()
      assertEquals(text, ['{', '  "example": "JSON for test suite"', '}', ''].join(EOL))
    },
  )
})

Deno.test('Deno implementation of FileTree', async (t) => {
  const srcdir = dirname(testDir)
  const parent = basename(testDir)
  const tree = await readFileTree(srcdir)
  await t.step('uses POSIX relative paths', () => {
    assertEquals(tree.path, '/')
    const parentObj = tree.get(parent) as FileTree
    assert(parentObj !== undefined)
    assertEquals(parentObj.path, `/${parent}`)
    const testObj = parentObj.get(testFilename) as BIDSFileDeno
    assert(testObj !== undefined)
    assertEquals(testObj.path, `/${parent}/${testFilename}`)
  })

  await t.step('implements pruning', async () => {
    const dsDir = join(repoRoot, 'tests', 'data', 'valid_dataset')
    const derivFile =
      'derivatives/fmriprep/sub-01/ses-01/func/sub-01_ses-01_task-rest_confounds.tsv.gz'

    const fullTree = await readFileTree(dsDir)
    assert(fullTree.get(derivFile))

    const prunedTree = await readFileTree(dsDir, prune)
    assert(!prunedTree.get(derivFile))
  })
})

const isWindows = Deno.build.os === 'windows'

async function withTempDataset(
  setup: (root: string) => Promise<void>,
  body: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir()
  try {
    await setup(root)
    await body(root)
  } finally {
    await new Deno.Command('chmod', { args: ['-R', '+w', root] }).output()
    await Deno.remove(root, { recursive: true })
  }
}

Deno.test({
  name: 'readFileTree: symlink to in-tree file resolves',
  ignore: isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withTempDataset(
    async (root) => {
      await Deno.writeTextFile(join(root, 'real.txt'), 'hello')
      await Deno.symlink('real.txt', join(root, 'link.txt'))
    },
    async (root) => {
      const tree = await readFileTree(root)
      const link = tree.get('link.txt')
      assert(link !== undefined, 'link.txt should be in tree.files')
      assertEquals(tree.links.length, 0, 'no unresolved links expected')
    },
  )
})

Deno.test({
  name: 'readFileTree: symlink to in-tree directory recurses (bug 1 regression)',
  ignore: isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withTempDataset(
    async (root) => {
      await Deno.mkdir(join(root, 'real-dir'))
      await Deno.writeTextFile(join(root, 'real-dir', 'inner.txt'), 'content')
      await Deno.symlink('real-dir', join(root, 'linked-dir'))
    },
    async (root) => {
      const tree = await readFileTree(root)
      const inner = tree.get('linked-dir/inner.txt')
      assert(inner !== undefined, 'linked-dir/inner.txt should appear via directory symlink')
      assertEquals(tree.links.length, 0)
    },
  )
})

Deno.test({
  name: 'readFileTree: dangling symlink produces a broken link entry (bug 2 regression)',
  ignore: isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withTempDataset(
    async (root) => {
      await Deno.symlink('nowhere.txt', join(root, 'broken.txt'))
    },
    async (root) => {
      const tree = await readFileTree(root)
      assertEquals(tree.get('broken.txt'), undefined, 'broken link should not be in tree.files')
      assertEquals(tree.links.length, 1)
      assertEquals(tree.links[0].path, '/broken.txt')
      assertEquals(tree.links[0].target, 'nowhere.txt')
      assertEquals(tree.links[0].reason, 'broken')
    },
  )
})

Deno.test({
  name: 'readFileTree: cyclic symlinks produce a cycle link entry',
  ignore: isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withTempDataset(
    async (root) => {
      await Deno.symlink('cycle-b', join(root, 'cycle-a'))
      await Deno.symlink('cycle-a', join(root, 'cycle-b'))
    },
    async (root) => {
      const tree = await readFileTree(root)
      const cycleLinks = tree.links.filter((l) => l.reason === 'cycle')
      assertEquals(cycleLinks.length, 2, 'both cycle-a and cycle-b should report cycle')
    },
  )
})

Deno.test({
  name: 'readFileTree: annex pointer symlink is classified as a file',
  ignore: isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const annexTarget =
    '../../.git/annex/objects/xx/yy/MD5E-s1234--d41d8cd98f00b204e9800998ecf8427e.nii.gz/MD5E-s1234--d41d8cd98f00b204e9800998ecf8427e.nii.gz'
  await withTempDataset(
    async (root) => {
      await Deno.mkdir(join(root, '.git', 'annex', 'objects'), { recursive: true })
      await Deno.mkdir(join(root, 'sub-01', 'func'), { recursive: true })
      await Deno.symlink(
        annexTarget,
        join(root, 'sub-01', 'func', 'sub-01_task-rest_bold.nii.gz'),
      )
    },
    async (root) => {
      const tree = await readFileTree(root)
      const file = tree.get('sub-01/func/sub-01_task-rest_bold.nii.gz')
      assert(file !== undefined, 'annex pointer should appear in tree.files')
      assertEquals(tree.links.length, 0, 'annex pointer should not be in tree.links')
    },
  )
})

Deno.test({
  name: 'readFileTree: out-of-tree file symlink is transparently followed',
  ignore: isWindows,
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const externalDir = await Deno.makeTempDir()
  await Deno.writeTextFile(join(externalDir, 'external.txt'), 'outside')
  try {
    await withTempDataset(
      async (root) => {
        await Deno.symlink(join(externalDir, 'external.txt'), join(root, 'external.txt'))
      },
      async (root) => {
        const tree = await readFileTree(root)
        const ext = tree.get('external.txt')
        assert(ext !== undefined, 'out-of-tree file symlink should appear via OS resolution')
        assertEquals(tree.links.length, 0)
      },
    )
  } finally {
    await Deno.remove(externalDir, { recursive: true })
  }
})

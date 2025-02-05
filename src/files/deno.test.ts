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
    const stream = file.stream
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
      await assertRejects(async () => file.text(), UnicodeDecodeError)
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
  await t.step('uses POSIX relative paths', async () => {
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

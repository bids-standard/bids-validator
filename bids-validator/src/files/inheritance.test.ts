import { assertEquals, assertThrows } from '@std/assert'
import { FileTree } from '../types/filetree.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { walkBack } from './inheritance.ts'
import { nullFile } from '../tests/nullFile.ts'

Deno.test('walkback inheritance tests', async (t) => {
  const rootFileTree = new FileTree('/', '')
  rootFileTree.files.push({
    path: '/',
    name: 'sub-01_T1w.json',
    ...nullFile,
    parent: rootFileTree,
  })
  rootFileTree.files.push({ path: '/', name: 'T1w.json', ...nullFile, parent: rootFileTree })
  const dataFile = {
    path: '/',
    name: 'sub-01_acq-test_T1w.nii',
    ...nullFile,
    parent: rootFileTree,
  }
  rootFileTree.files.push(dataFile)
  await t.step('walkBack throws multiple inheritance error', async () => {
    assertThrows(() => {
      try {
        const sidecars = walkBack(dataFile)
        for (const f of sidecars) {
          continue
        }
      } catch (error) {
        assertEquals(error.code, 'MULTIPLE_INHERITABLE_FILES')
        throw error
      }
    })
  })
  await t.step(
    'no error thrown on exact inheritance match with multiple valid candidates',
    async () => {
      rootFileTree.files.push({
        path: '/',
        name: 'sub-01_acq-test_T1w.json',
        ...nullFile,
        parent: rootFileTree,
      })
      const sidecars = walkBack(dataFile)
      const sidecarFiles = []
      for (const f of sidecars) {
        sidecarFiles.push(f)
      }
      assertEquals(sidecarFiles.length, 1)
      assertEquals(sidecarFiles[0].name, 'sub-01_acq-test_T1w.json')
    },
  )
})

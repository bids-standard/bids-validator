import { assertEquals, assertThrows } from '../deps/asserts.ts'
import { FileTree } from '../types/filetree.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { walkBack } from './inheritance.ts'
import { nullFile } from '../tests/nullFile.ts'

Deno.test('walkBack throws multiple inheritance error', async (t) => {
  const rootFileTree = new FileTree('/', '')
  rootFileTree.files.push({ path: '/', name: 'sub-01_T1w.json', ...nullFile, parent: rootFileTree})
  rootFileTree.files.push({ path: '/', name: 'T1w.json', ...nullFile, parent: rootFileTree})
  const dataFile =   { path: '/', name: 'sub-01_acq-test_T1w.nii', ...nullFile, parent: rootFileTree}
  rootFileTree.files.push(dataFile)
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

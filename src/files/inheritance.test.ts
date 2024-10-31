import { assert, assertEquals, assertThrows } from '@std/assert'
import { pathsToTree } from './filetree.ts'
import { walkBack } from './inheritance.ts'

Deno.test('walkback inheritance tests', async (t) => {
  await t.step('walkBack throws multiple inheritance error', async () => {
    const rootFileTree = pathsToTree([
      '/T1w.json',
      '/acq-MPRAGE_T1w.json',
      '/sub-01/anat/sub-01_acq-MPRAGE_T1w.nii.gz',
    ])
    const dataFile = rootFileTree.directories[0].directories[0].files[0]
    assertThrows(() => {
      try {
        const sidecars = walkBack(dataFile)
        for (const f of sidecars) {
          continue
        }
      } catch (error) {
        assert(error)
        assert(typeof error === 'object')
        assert('code' in error)
        assertEquals(error.code, 'MULTIPLE_INHERITABLE_FILES')
        throw error
      }
    })
  })
  await t.step(
    'no error thrown on exact inheritance match with multiple valid candidates',
    async () => {
      const rootFileTree = pathsToTree([
        '/T1w.json',
        '/sub-01/anat/sub-01_acq-MPRAGE_T1w.nii.gz',
        '/sub-01/anat/sub-01_acq-MPRAGE_T1w.json',
        '/sub-01/anat/sub-01_T1w.json',
      ])
      const dataFile = rootFileTree.directories[0].directories[0].files[0]
      const sidecars = walkBack(dataFile)
      const sidecarFiles = []
      for (const f of sidecars) {
        sidecarFiles.push(f)
      }
      assertEquals(sidecarFiles.length, 2)
      assertEquals(sidecarFiles.map((f) => f.path), [
        '/sub-01/anat/sub-01_acq-MPRAGE_T1w.json',
        '/T1w.json',
      ])
    },
  )
})

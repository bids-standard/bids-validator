import { assert } from 'chai'
import duplicateNiftis from '../duplicateFiles'

describe('duplicateFiles', () => {
  describe('duplicateNiftis()', () => {
    const file1nii = { name: 'file1.nii' }
    const file1gz = { name: 'file1.nii.gz' }
    const file2nii = { name: 'file2.nii' }
    const file2gz = { name: 'file2.nii.gz' }

    it('throws no issues if there are no nifti files', () => {
      const files = []
      const issues = duplicateNiftis(files)
      assert.lengthOf(issues, 0)
    })

    it('allows nifti files with distinct names and extensions', () => {
      const files = [file1nii, file2gz]
      const issues = duplicateNiftis(files)
      assert.lengthOf(issues, 0)
    })

    it('allows nifti files with distinct names and the same extension', () => {
      const files = [file1nii, file2nii]
      const issues = duplicateNiftis(files)
      assert.lengthOf(issues, 0)
    })

    it('throws an error if a the same filename with .nii and .nii.gz extensions are present', () => {
      const files = [file1gz, file1nii]
      const issues = duplicateNiftis(files)
      assert.lengthOf(issues, 2)
    })
  })
})

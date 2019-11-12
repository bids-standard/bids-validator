import { assert } from 'chai'
import { getFolderSubjects } from '../checkAnyDataPresent.js'

describe('checkAnyDataPresent', () => {
  describe('getFolderSubjects()', () => {
    it('returns only unique subjects', () => {
      // Pseudo-FileList object but an array simulates it
      const fileList = [
        { relativePath: 'sub-01/files' },
        { relativePath: 'sub-01/another' },
        { relativePath: 'sub-02/data' },
      ]
      const subjects = getFolderSubjects(fileList)
      assert.isArray(subjects)
      assert.deepEqual(subjects, ['01', '02'])
    })
    it('filters out emptyroom subject', () => {
      const fileList = [
        { relativePath: 'sub-01/files' },
        { relativePath: 'sub-emptyroom/data' },
      ]
      const subjects = getFolderSubjects(fileList)
      assert.isArray(subjects)
      assert.deepEqual(subjects, ['01'])
    })
    it('works for deeply nested files', () => {
      const fileList = [
        { relativePath: 'sub-01/files/a.nii.gz' },
        { relativePath: 'sub-01/another/b.nii.gz' },
        { relativePath: 'sub-02/data/test' },
      ]
      const subjects = getFolderSubjects(fileList)
      assert.isArray(subjects)
      assert.deepEqual(subjects, ['01', '02'])
    })
    it('works with object arguments', () => {
      const fileList = { 0: { relativePath: 'sub-01/anat/one.nii.gz' } }
      const subjects = getFolderSubjects(fileList)
      assert.isArray(subjects)
      assert.deepEqual(subjects, ['01'])
    })
  })
})

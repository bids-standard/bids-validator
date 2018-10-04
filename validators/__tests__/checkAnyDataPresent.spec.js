const assert = require('chai').assert
const { getFolderSubjects } = require('../checkAnyDataPresent.js')

describe('checkAnyDataPresent', () => {
  describe('getFolderSubjects()', () => {
    it('returns only unique subjects', () => {
      // Native FileList but an array simulates it
      const fileList = [
        { relativePath: 'sub-01/files' },
        { relativePath: 'sub-01/another' },
        { relativePath: 'sub-02/data' },
      ]
      assert.equal(2, getFolderSubjects(fileList).length)
    })
    it('filters out emptyroom subject', () => {
      const fileList = [
        { relativePath: 'sub-01/files' },
        { relativePath: 'sub-emptyroom/data' },
      ]
      assert.equal(1, getFolderSubjects(fileList).length)
    })
  })
})

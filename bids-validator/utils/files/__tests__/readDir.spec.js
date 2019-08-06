const readDir = require('../readDir.js')

describe('readDir.js', () => {
  describe('fileArrayToObject', () => {
    it('transforms an array to an object', () => {
      expect(
        readDir.fileArrayToObject([
          { name: 'one' },
          { name: 'two' },
          { name: 'three' },
        ]),
      ).toEqual({
        '0': {
          name: 'one',
        },
        '1': {
          name: 'two',
        },
        '2': {
          name: 'three',
        },
      })
    })
  })
})

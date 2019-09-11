const { assert } = require('chai')
const collectSubjectMetadata = require('../summary/collectSubjectMetadata')

describe('collectSubjectMetadata', () => {
  it('extracts tsv string to subjectMetadata object', () => {
    const tsvFile = `participant_id	age	sex
sub-01	34	F
sub-02	38	M
`
    const subjectMetadata = collectSubjectMetadata(tsvFile)
    assert.deepEqual(subjectMetadata, {
      '01': {
        age: 34,
        sex: 'F',
      },
      '02': {
        age: 38,
        sex: 'M',
      },
    })
  })
  it('extracts tsv string to subjectMetadata object', () => {
    const tsvFile = ``
    const subjectMetadata = collectSubjectMetadata(tsvFile)
    assert.equal(subjectMetadata, undefined)
  })
})

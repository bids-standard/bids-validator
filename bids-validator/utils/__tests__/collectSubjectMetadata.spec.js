import { assert } from 'chai'
import collectSubjectMetadata from '../summary/collectSubjectMetadata'

describe('collectSubjectMetadata', () => {
  it('extracts tsv string to subjectMetadata object', () => {
    const tsvFile = `participant_id	age	sex
sub-01	34	F
sub-02	38	M
`
    const subjectMetadata = collectSubjectMetadata(tsvFile)
    assert.lengthOf(subjectMetadata, 2)
    assert.deepEqual(subjectMetadata[0], {
      participantId: '01',
      age: 34,
      sex: 'F',
    })
  })
  it('extracts tsv string to subjectMetadata object', () => {
    const tsvFile = ``
    const subjectMetadata = collectSubjectMetadata(tsvFile)
    assert.equal(subjectMetadata, undefined)
  })
})

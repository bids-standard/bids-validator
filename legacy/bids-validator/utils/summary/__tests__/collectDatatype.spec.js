import {
  ds001421,
  ds001734,
  ds003400,
} from '../../../tests/data/collectModalities-data'
import collectDatatype from '../collectDataTypes'

describe('collectDatatype()', () => {
  it('includes types such as T1w', () => {
    expect(collectDatatype(ds001734)).toEqual([
      'magnitude1',
      'magnitude2',
      'phasediff',
      'T1w',
      'sbref',
      'bold',
      'events',
    ])
    expect(collectDatatype(ds001421)).toEqual(['pet', 'T1w'])
  })
  it('does not include T1w when missing', () => {
    expect(collectDatatype(ds003400)).not.toContain('T1w')
  })
})

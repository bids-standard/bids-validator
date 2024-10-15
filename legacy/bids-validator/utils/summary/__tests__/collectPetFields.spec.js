import collectPetFields, { orderedList } from '../collectPetFields.js'
import jsonContentsDict from '../../../tests/data/pet001_jsonContentsDict'

describe('collectPetFields()', () => {
  it('extracts an ordered list of pet specific fields', () => {
    expect(collectPetFields(jsonContentsDict)).toEqual({
      BodyPart: ['Brain'],
      ScannerManufacturer: ['Siemens'],
      ScannerManufacturersModelName: [
        'High-Resolution Research Tomograph (HRRT, CTI/Siemens)',
      ],
      TracerName: ['CIMBI-36'],
      TracerRadionuclide: ['C11'],
    })
  })
})

describe('orderedList()', () => {
  it('reduces a tally object to an ordered list', () => {
    expect(orderedList({ a: 3, b: 5, c: 1 })).toEqual(['b', 'a', 'c'])
  })
  it('handles empty objects', () => {
    expect(orderedList({})).toEqual([])
  })
})

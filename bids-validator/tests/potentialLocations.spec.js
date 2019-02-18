const assert = require('assert')
const potentialLocations = require('../utils/files/potentialLocations')
const test_version = '1.1.1u1'

describe('potentialLocations', function() {
  it('should not return duplicate paths', function() {
    const path = 'data/BIDS-examples-' + test_version + '/ds001'
    const pLs = potentialLocations(path)
    assert.deepEqual(pLs.length, new Set(pLs).size)
  })
})

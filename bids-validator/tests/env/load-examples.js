const fs = require('fs')
const request = require('sync-request')
const AdmZip = require('adm-zip')

const test_version = '1.1.1u1'

const loadExamples = () => {
  if (!fs.existsSync('tests/data/bids-examples-' + test_version + '/')) {
    console.log('downloading test data')
    const response = request(
      'GET',
      'http://github.com/bids-standard/bids-examples/archive/' +
        test_version +
        '.zip',
    )
    if (!fs.existsSync('bids-validator/tests/data')) {
      fs.mkdirSync('bids-validator/tests/data')
    }
    fs.writeFileSync('bids-validator/tests/data/examples.zip', response.body)
    const zip = new AdmZip('bids-validator/tests/data/examples.zip')
    console.log('unzipping test data')
    zip.extractAllTo('bids-validator/tests/data/', true)
  }
  return test_version
}

module.exports = loadExamples
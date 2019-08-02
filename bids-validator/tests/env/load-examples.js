const fs = require('fs')
const { promisify } = require('util')
const request = require('sync-request')
const AdmZip = require('adm-zip')
const lockfile = require('lockfile')

const lockPromise = promisify(lockfile.lock)

const test_version = '1.2.0'
const examples_lock = 'bids-validator/tests/data/examples.lockfile'
// Wait for up to five minutes for examples to finish
// downloading in another test worker
const examples_lock_opts = { wait: 300000 }

const loadExamples = async () => {
  await lockPromise(examples_lock, examples_lock_opts)
  if (
    !fs.existsSync(
      'bids-validator/tests/data/bids-examples-' + test_version + '/',
    )
  ) {
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
  lockfile.unlockSync(examples_lock)
  return test_version
}

module.exports = loadExamples

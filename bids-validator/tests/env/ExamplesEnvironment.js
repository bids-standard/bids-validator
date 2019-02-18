/*eslint no-console: ["error", { allow: ["log"] }] */
const fs = require('fs')
const request = require('sync-request')
const AdmZip = require('adm-zip')
const NodeEnvironment = require('jest-environment-node')

const test_version = '1.1.1u1'

// Environment which includes the bids-examples datasets
class ExamplesEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config)
  }

  async setup() {
    await super.setup()
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
    this.global.test_version = test_version
  }

  async teardown() {
    await super.teardown()
  }

  runScript(script) {
    return super.runScript(script)
  }
}

module.exports = ExamplesEnvironment

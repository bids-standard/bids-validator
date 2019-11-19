/*eslint no-console: ["error", { allow: ["log"] }] */
const NodeEnvironment = require('jest-environment-node')

const config = require('./config')

// Environment which includes the bids-examples datasets
class ExamplesEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.test_version = config.TEST_VERSION
  }

  async teardown() {
    await super.teardown()
  }

  runScript(script) {
    return super.runScript(script)
  }
}

module.exports = ExamplesEnvironment

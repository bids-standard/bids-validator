/*eslint no-console: ["error", { allow: ["log"] }] */
const NodeEnvironment = require('jest-environment-node')
const loadExamples = require('./load-examples.js')

// Environment which includes the bids-examples datasets
class ExamplesEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.test_version = await loadExamples()
  }

  async teardown() {
    await super.teardown()
  }

  runScript(script) {
    return super.runScript(script)
  }
}

module.exports = ExamplesEnvironment

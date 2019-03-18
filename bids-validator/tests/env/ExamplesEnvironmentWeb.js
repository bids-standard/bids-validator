/*eslint no-console: ["error", { allow: ["log"] }] */
const JsdomEnvironment = require('jest-environment-jsdom-global')
const loadExamples = require('./load-examples.js')

// Environment which includes the bids-examples datasets
class ExamplesEnvironmentWeb extends JsdomEnvironment {
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

module.exports = ExamplesEnvironmentWeb

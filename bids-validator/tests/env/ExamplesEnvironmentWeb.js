/*eslint no-console: ["error", { allow: ["log"] }] */
const JsdomEnvironment = require('jest-environment-jsdom-global')

const config = require('./config')

// Environment which includes the bids-examples datasets
class ExamplesEnvironmentWeb extends JsdomEnvironment {
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

module.exports = ExamplesEnvironmentWeb

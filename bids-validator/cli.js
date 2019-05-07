/*eslint no-console: ["error", {allow: ["log"]}] */

var validate = require('./index.js')
var colors = require('colors/safe')
var fs = require('fs')
const remoteFiles = require('./utils/files/remoteFiles')

const exitProcess = issues => {
  if (
    issues === 'Invalid' ||
    (issues.errors && issues.errors.length >= 1) ||
    (issues.config && issues.config.length >= 1)
  ) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

module.exports = function(dir, options) {
  if (fs.existsSync(dir)) {
    if (options.json) {
      validate.BIDS(dir, options, function(issues, summary) {
        console.log(JSON.stringify({ issues, summary }))
        exitProcess(issues)
      })
    } else {
      validate.BIDS(dir, options, function(issues, summary) {
        console.log(validate.consoleFormat.issues(issues, options) + '\n')
        console.log(validate.consoleFormat.summary(summary, options))
        exitProcess(issues)
      })
    }
  } else {
    console.log(colors.red(dir + ' does not exist'))
    process.exit(2)
  }
}

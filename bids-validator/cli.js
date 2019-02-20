/*eslint no-console: ["error", {allow: ["log"]}] */

var validate = require('./index.js')
var colors = require('colors/safe')
var fs = require('fs')

module.exports = function(dir, options) {
  if (fs.existsSync(dir)) {
    if (options.json) {
      validate.BIDS(dir, options, function(issues, summary) {
        console.log(JSON.stringify({ issues, summary }))
      })
    } else {
      validate.BIDS(dir, options, function(issues, summary) {
        console.log(validate.consoleFormat.issues(issues, options) + '\n')
        console.log(validate.consoleFormat.summary(summary, options))
      })
    }
  } else {
    console.log(colors.red(dir + ' does not exist'))
    process.exit(2)
  }
}

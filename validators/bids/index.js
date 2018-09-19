const start = require('./start')
const reset = require('./reset')
const quickTest = require('./quickTest')
const quickTestError = require('./quickTestError')
const fullTest = require('./fullTest')
const subIDsesIDmismatchTest = require('./subSesMismatchTest')

module.exports = {
  options: {},
  issues: [],
  start: start,
  quickTestError: quickTestError,
  quickTest: quickTest,
  fullTest: fullTest,
  subIDsesIDmismatchtest: subIDsesIDmismatchTest,
  reset: reset,
}

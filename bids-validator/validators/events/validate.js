const eventsTest = require('./events')

const validate = (events, stimuli, headers, jsonContents) => {
  return eventsTest(events, stimuli, headers, jsonContents)
}

module.exports = validate

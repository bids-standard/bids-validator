const events = require('./events')
const hed = require('./hed')
const validate = require('./validate')

module.exports = {
  events: events,
  hed: hed,
  validateEvents: validate,
}

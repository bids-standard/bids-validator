require('./prototype')
var array = require('./array')
var config = require('./config')
var files = require('./files')
var bids_files = require('./bids_files')
var issues = require('./issues')
var json = require('./json')
var modalities = require('./modalities')
var options = require('./options')
var type = require('./type')
const collectSummary = require('./summary').collectSummary

module.exports = {
  array: array,
  config: config,
  files: files,
  bids_files: bids_files,
  issues: issues,
  json: json,
  modalities: modalities,
  options: options,
  type: type,
  collectSummary: collectSummary,
}

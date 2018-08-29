var utils = require('../utils')
var Ajv = require('ajv')
var ajv = new Ajv({ allErrors: true })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'))
var Issue = utils.issues.Issue

/**
 * JSON
 *
 * Takes a JSON file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function(file, contents, callback) {
  // primary flow --------------------------------------------------------------------

  var issues = []

  utils.json.parse(file, contents, function(pissues, jsObj) {
    issues = pissues
    if (jsObj) {
      issues = issues.concat(checkUnits(file, jsObj))
    }
    callback(issues, jsObj)
  })
}

// individual checks ---------------------------------------------------------------

function checkUnits(file, sidecar) {
  var issues = []
  var schema = null

  if (file.name) {
    if (file.name.endsWith('participants.json')) {
      schema = require('./schemas/data_dictionary.json')
    } else if (
      file.name.endsWith('bold.json') ||
      file.name.endsWith('sbref.json')
    ) {
      schema = require('./schemas/bold.json')
    } else if (file.relativePath === '/dataset_description.json') {
      schema = require('./schemas/dataset_description.json')
    } else if (file.name.endsWith('meg.json')) {
      schema = require('./schemas/meg.json')
    } else if (file.name.endsWith('ieeg.json')) {
      schema = require('./schemas/ieeg.json')
    } else if (file.name.endsWith('eeg.json')) {
      schema = require('./schemas/eeg.json')
    } else if (
      file.relativePath.includes('/meg/') &&
      file.name.endsWith('coordsystem.json')
    ) {
      schema = require('./schemas/coordsystem_meg.json')
    } else if (
      file.relativePath.includes('/ieeg/') &&
      file.name.endsWith('coordsystem.json')
    ) {
      schema = require('./schemas/coordsystem_ieeg.json')
    } else if (
      file.relativePath.includes('/eeg/') &&
      file.name.endsWith('coordsystem.json')
    ) {
      schema = require('./schemas/coordsystem_eeg.json')
    }
    if (schema) {
      var validate = ajv.compile(schema)
      var valid = validate(sidecar)
      if (!valid) {
        for (var i = 0; i < validate.errors.length; i++) {
          issues.push(
            new Issue({
              file: file,
              code: 55,
              evidence:
                validate.errors[i].dataPath + ' ' + validate.errors[i].message,
            }),
          )
        }
      }
    }
  }

  if (
    sidecar.hasOwnProperty('RepetitionTime') &&
    sidecar['RepetitionTime'] > 100
  ) {
    issues.push(
      new Issue({
        file: file,
        code: 2,
      }),
    )
  }
  if (sidecar.hasOwnProperty('EchoTime') && sidecar['EchoTime'] > 1) {
    issues.push(
      new Issue({
        file: file,
        code: 3,
      }),
    )
  }
  if (sidecar.hasOwnProperty('EchoTime1') && sidecar['EchoTime1'] > 1) {
    issues.push(
      new Issue({
        file: file,
        code: 4,
      }),
    )
  }
  if (sidecar.hasOwnProperty('EchoTime2') && sidecar['EchoTime2'] > 1) {
    issues.push(
      new Issue({
        file: file,
        code: 4,
      }),
    )
  }
  if (
    sidecar.hasOwnProperty('TotalReadoutTime') &&
    sidecar['TotalReadoutTime'] > 10
  ) {
    issues.push(
      new Issue({
        file: file,
        code: 5,
      }),
    )
  }
  return issues
}

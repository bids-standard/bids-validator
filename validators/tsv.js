/* eslint-disable no-unused-vars */
var Issue = require('../utils').issues.Issue
var files = require('../utils/files')
var utils = require('../utils')
var dateIsValid = require('date-fns/isValid')
var parseDate = require('date-fns/parse')
const nonCustomColumns = require('../bids_validator/tsv/non_custom_columns.json')
/**
 * TSV
 *
 * Takes a TSV file as a string and a callback
 * as arguments. And callsback with any issues
 * it finds while validating against the BIDS
 * specification.
 */
var TSV = function TSV(file, contents, fileList, callback) {
  var issues = []
  var stimPaths = []
  if (contents.includes('\r') && !contents.includes('\n')) {
    issues.push(
      new Issue({
        file: file,
        evidence: contents,
        code: 70,
      }),
    )
    callback(issues, null)
    return
  }

  var rows = contents.split('\n')
  var headers = rows[0].split('\t')

  // generic checks -----------------------------------------------------------

  var columnMismatch = false
  var emptyCells = false
  var NACells = false
  // iterate rows
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i]
    if (columnMismatch && emptyCells && NACells) {
      break
    }

    // skip empty rows
    if (!row || /^\s*$/.test(row)) {
      continue
    }

    var values = row.split('\t')

    // check for different length rows
    if (values.length !== headers.length && !columnMismatch) {
      columnMismatch = true
      issues.push(
        new Issue({
          file: file,
          evidence: row,
          line: i + 1,
          code: 22,
        }),
      )
    }

    // iterate values
    for (var j = 0; j < values.length; j++) {
      var value = values[j]
      if (columnMismatch && emptyCells && NACells) {
        break
      }

      if (value === '' && !emptyCells) {
        emptyCells = true
        // empty cell should raise an error
        issues.push(
          new Issue({
            file: file,
            evidence: row,
            line: i + 1,
            reason: 'Missing value at column # ' + (j + 1),
            code: 23,
          }),
        )
      } else if (
        (value === 'NA' ||
          value === 'na' ||
          value === 'nan' ||
          value === 'NaN') &&
        !NACells
      ) {
        NACells = true
        // check if missing value is properly labeled as 'n/a'
        issues.push(
          new Issue({
            file: file,
            evidence: row,
            line: i + 1,
            reason: 'Missing value at column # ' + (j + 1),
            code: 24,
          }),
        )
      }
    }
  }

  // specific file checks -----------------------------------------------------
  var checkheader = function checkheader(headername, idx, file, code) {
    if (headers[idx] !== headername) {
      issues.push(
        new Issue({
          file: file,
          evidence: headers,
          line: 1,
          character: rows[0].indexOf(headers[idx]),
          code: code,
        }),
      )
    }
  }

  // events.tsv
  if (file.name.endsWith('_events.tsv')) {
    if (headers.length == 0 || headers[0] !== 'onset') {
      issues.push(
        new Issue({
          file: file,
          evidence: headers,
          line: 1,
          code: 20,
        }),
      )
    }
    if (headers.length == 1 || headers[1].trim() !== 'duration') {
      issues.push(
        new Issue({
          file: file,
          evidence: headers,
          line: 1,
          code: 21,
        }),
      )
    }

    // create full dataset path list
    var pathList = []
    for (var f in fileList) {
      pathList.push(fileList[f].relativePath)
    }

    // check for stimuli file
    var stimFiles = []
    if (headers.indexOf('stim_file') > -1) {
      for (var k = 0; k < rows.length; k++) {
        var stimFile = rows[k].split('\t')[headers.indexOf('stim_file')]
        var stimPath = '/stimuli/' + stimFile
        if (
          stimFile &&
          stimFile !== 'n/a' &&
          stimFile !== 'stim_file' &&
          stimFiles.indexOf(stimFile) == -1
        ) {
          stimFiles.push(stimFile)
          stimPaths.push(stimPath)
          if (pathList.indexOf(stimPath) == -1) {
            issues.push(
              new Issue({
                file: file,
                evidence: stimFile,
                reason:
                  'A stimulus file (' +
                  stimFile +
                  ') was declared but not found in /stimuli.',
                line: k + 1,
                character: rows[k].indexOf(stimFile),
                code: 52,
              }),
            )
          }
        }
      }
    }
  }

  // participants.tsv
  var participants = null
  if (
    file.name === 'participants.tsv' ||
    file.relativePath.includes('phenotype/')
  ) {
    var participantIdColumn = headers.indexOf('participant_id')
    if (participantIdColumn === -1) {
      issues.push(
        new Issue({
          file: file,
          evidence: headers.join('\t'),
          line: 1,
          code: 48,
        }),
      )
    } else {
      participants = []
      for (var l = 1; l < rows.length; l++) {
        row = rows[l].split('\t')
        // skip empty rows
        if (!row || /^\s*$/.test(row)) {
          continue
        }
        participants.push(row[participantIdColumn].replace('sub-', ''))
      }
    }
  }

  // channels.tsv
  if (
    file.relativePath.includes('/meg/') &&
    file.name.endsWith('_channels.tsv')
  ) {
    checkheader('name', 0, file, 71)
    checkheader('type', 1, file, 71)
    checkheader('units', 2, file, 71)
  }

  if (
    file.relativePath.includes('/ieeg/') &&
    file.name.endsWith('_channels.tsv')
  ) {
    checkheader('name', 0, file, 72)
    checkheader('type', 1, file, 72)
    checkheader('units', 2, file, 72)
    checkheader('sampling_frequency', 3, file, 72)
    checkheader('low_cutoff', 4, file, 72)
    checkheader('high_cutoff', 5, file, 72)
    checkheader('notch', 6, file, 72)
    checkheader('reference', 7, file, 72)
  }

  if (
    file.relativePath.includes('/ieeg/') &&
    file.name.endsWith('_electrodes.tsv')
  ) {
    checkheader('name', 0, file, 73)
    checkheader('x', 1, file, 73)
    checkheader('y', 2, file, 73)
    checkheader('z', 3, file, 73)
    checkheader('size', 4, file, 73)
  }

  // check partcipants.tsv for age 89+

  if (file.name === 'participants.tsv') {
    checkage89_plus(rows, file, issues)
  }

  if (file.name.endsWith('_scans.tsv')) {
    // check _scans.tsv for column filename
    if (!(headers.indexOf('filename') > -1)) {
      issues.push(
        new Issue({
          line: 1,
          file: file,
          evidence: headers.join('\t'),
          code: 68,
        }),
      )
    }

    // if _scans.tsv has the acq_time header, check datetime format
    if (headers.indexOf('acq_time') > -1) {
      checkAcqTimeFormat(rows, file, issues)
    }
  }

  callback(issues, participants, stimPaths)
}
var checkphenotype = function(phenotypeParticipants, summary, issues) {
  for (var j = 0; j < phenotypeParticipants.length; j++) {
    var fileParticpants = phenotypeParticipants[j]
    if (
      phenotypeParticipants &&
      phenotypeParticipants.length > 0 &&
      !utils.array.equals(fileParticpants.list, summary.subjects.sort(), true)
    ) {
      issues.push(
        new Issue({
          code: 51,
          evidence:
            fileParticpants.file +
            '- ' +
            fileParticpants.list +
            '  Subjects -' +
            fileParticpants,
          file: fileParticpants.file,
        }),
      )
    }
  }
}

var checkage89_plus = function(rows, file, issues) {
  var header = rows[0].trim().split('\t')
  var ageIdColumn = header.indexOf('age')
  for (var a = 0; a < rows.length; a++) {
    var line = rows[a]
    var line_values = line.trim().split('\t')
    var age = line_values[ageIdColumn]
    if (age >= 89) {
      issues.push(
        new Issue({
          file: file,
          evidence: line,
          line: a + 1,
          reason: 'age of partcipant is above 89 ',
          code: 56,
        }),
      )
    }
  }
}

const checkAcqTimeFormat = function(rows, file, issues) {
  const format = "YYYY-MM-DD'T'HH:mm:ss"
  const header = rows[0].trim().split('\t')
  const acqTimeColumn = header.indexOf('acq_time')
  const testRows = rows.slice(1)
  for (let i = 0; i < testRows.length; i++) {
    const line = testRows[i]
    const lineValues = line.trim().split('\t')
    const acqTime = lineValues[acqTimeColumn]
    var isValid = dateIsValid(parseDate(acqTime, format, new Date()))
    if (acqTime === 'n/a') {
      isValid = true
    }
    if (acqTime && !isValid) {
      issues.push(
        new Issue({
          file: file,
          evidence: acqTime,
          line: i + 2,
          reason: 'acq_time is not in the format YYYY-MM-DDTHH:mm:ss ',
          code: 84,
        }),
      )
    }
  }
}

/**
 * @param {Object} file - BIDS file object
 * Accepts file object and returns a type based on file path
 */
const getTsvType = function(file) {
  let tsvType = 'misc'
  if (file.relativePath.includes('phenotype/')) {
    tsvType = 'phenotype'
  } else if (file.name === 'participants.tsv') {
    tsvType = 'participants'
  } else if (
    file.name.endsWith('_channels.tsv') ||
    file.name.endsWith('_events.tsv') ||
    file.name.endsWith('_scans.tsv') ||
    file.name.endsWith('_sessions.tsv')
  ) {
    const split = file.name.split('_')
    tsvType = split[split.length - 1].replace('.tsv', '')
  }
  return tsvType
}

/**
 *
 * @param {array} headers -Array of column names
 * @param {string} type - Type from getTsvType
 * Checks TSV column names to determine if they're core or custom
 * Returns array of custom column names
 */
const getCustomColumns = function(headers, type) {
  const customCols = []
  // Iterate column headers
  for (let col of headers) {
    //console.log('Column name: ' + col)
    // If it's a custom column
    if (!nonCustomColumns[type].includes(col)) {
      //console.log('Field name: ' + col + ' is not in ' + nonCustomColumns[type])
      customCols.push(col)
    }
  }
  //console.log(customCols)
  return customCols
}

/**
 *
 * @param {array} tsvs - Array of objects containing TSV file objects and contents
 * @param {Object} jsonContentsDict
 */
const validateTsvColumns = function(tsvs, jsonContentsDict) {
  let tsvIssues = []
  tsvs.map(tsv => {
    const tsvType = getTsvType(tsv.file)
    const customColumns = getCustomColumns(
      tsv.contents.split('\n')[0].split('\t'),
      tsvType,
    )
    if (customColumns.length > 0) {
      // Get merged data dictionary for this file
      const potentialSidecars = utils.files.potentialLocations(
        tsv.file.relativePath.replace('.tsv', '.json'),
      )
      const mergedDict = utils.files.generateMergedSidecarDict(
        potentialSidecars,
        jsonContentsDict,
      )
      const keys = Object.keys(mergedDict)
      // Check each custom field against merged data dict
      customColumns.map(col => {
        if (!keys.includes(col)) {
          tsvIssues.push(customColumnIssue(tsv.file, col, potentialSidecars))
        }
      })
    }
  })
  // Return array of all instances of undescribed custom columns
  return tsvIssues
}

const customColumnIssue = function(file, col, locations) {
  return new Issue({
    code: 82,
    file: file,
    evidence:
      'Column ' +
      col +
      ' is not defined, please define in: ' +
      locations.toString().replace(',', ', '),
  })
}

module.exports = {
  TSV: TSV,
  checkphenotype: checkphenotype,
  validateTsvColumns: validateTsvColumns,
}

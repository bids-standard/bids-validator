const Issue = require('../../utils').issues.Issue
const dateIsValid = require('date-fns/isValid')
const parseDate = require('date-fns/parse')

const checkAcqTimeFormat = function(rows, file, issues) {
  const format = "YYYY-MM-DD'T'HH:mm:ss"
  const header = rows[0].trim().split('\t')
  const acqTimeColumn = header.indexOf('acq_time')
  const testRows = rows.slice(1)
  testRows.map((line, i) => {
    const lineValues = line.trim().split('\t')
    const acqTime = lineValues[acqTimeColumn]
    let isValid = dateIsValid(parseDate(acqTime, format, new Date()))
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
  })
}

module.exports = checkAcqTimeFormat

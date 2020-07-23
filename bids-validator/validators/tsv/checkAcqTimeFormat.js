const Issue = require('../../utils').issues.Issue
import { isValid as dateIsValid, parse } from 'date-fns'

const checkAcqTimeFormat = function(rows, file, issues) {
  const header = rows[0]
  const acqTimeColumn = header.indexOf('acq_time')
  const testRows = rows.slice(1)
  testRows.map((line, i) => {
    var format = "yyyy-MM-dd'T'HH:mm:ss"
    const lineValues = line
    const acqTime = lineValues[acqTimeColumn]
    // Try different date formats: We accept any amount of optional fractional
    // seconds: .S, .SS, .SSS, .SSSS, .SSSSS, .SSSSSS
    var isValid = false
    for (i = 0; i < 7; i++) {

      isValid = dateIsValid(parse(acqTime, format, new Date()))

      // exit early if date is valid or n/a
      if (acqTime === 'n/a' | isValid) {
        isValid = true
        break
      }

      // If not valid, try again with parsing a new amount of fractional secs
      if (i === 0) {
        format += '.'
      }
      format += 'S'
    }

    // if the loop exits with !isValid, we need to raise an issue
    if (acqTime && !isValid) {
      issues.push(
        new Issue({
          file: file,
          evidence: acqTime,
          line: i + 2,
          reason: 'acq_time is not in the format yyyy-MM-ddTHH:mm:ss ',
          code: 84,
        }),
      )
    }
  })
}

export default checkAcqTimeFormat

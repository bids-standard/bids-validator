const Issue = require('../../utils').issues.Issue
import { isValid as dateIsValid, parse } from 'date-fns'

const checkAcqTimeFormat = function(rows, file, issues) {
  const format = "yyyy-MM-dd'T'HH:mm:ss"
  const header = rows[0]
  const acqTimeColumn = header.indexOf('acq_time')
  const testRows = rows.slice(1)
  testRows.map((line, i) => {
    const lineValues = line
    const acqTime = lineValues[acqTimeColumn]
    let isValid = dateIsValid(parse(acqTime, format, new Date()))
    if (acqTime === 'n/a') {
      isValid = true
    }
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

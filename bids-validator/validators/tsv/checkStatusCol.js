const Issue = require('../../utils').issues.Issue

const checkStatusCol = function(rows, file, issues) {
  const header = rows[0]
  const statusColumn = header.indexOf('status')
  if (statusColumn !== -1) {
    for (let i = 1; i < rows.length; i++) {
      const line = rows[i]
      const status = line[statusColumn]
      if (status !== 'good' && status !== 'bad') {
        issues.push(
          new Issue({
            file: file,
            evidence: line,
            line: i + 1,
            reason: 'the status column values should either be good or bad ',
            code: 125,
          }),
        )
      }
    }
  }
  return
}

export default checkStatusCol

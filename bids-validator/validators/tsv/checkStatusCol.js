const Issue = require('../../utils').issues.Issue

const checkStatusCol = function(rows, file, issues) {
  const header = rows[0]
  const statusColumn = header.indexOf('status')
  if (statusColumn !== -1) {
    for (let a = 0; a < rows.length; a++) {
      const line = rows[a]
      const status = line[statusColumn]
      if (status !== 'good' || status !== 'bad') {
        issues.push(
          new Issue({
            file: file,
            evidence: line,
            line: a + 1,
            reason: 'the status column should have only one of two values each row: good or bad ',
            code: 125,
          }),
        )
      }
    }
  }
  return
}

export default checkStatusCol

const Issue = require('../../utils').issues.Issue

const checkAge89 = function(rows, file, issues) {
  const header = rows[0].trim().split('\t')
  const ageIdColumn = header.indexOf('age')
  for (var a = 0; a < rows.length; a++) {
    const line = rows[a]
    const line_values = line.trim().split('\t')
    const age = line_values[ageIdColumn]
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

module.exports = checkAge89

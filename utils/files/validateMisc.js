const Issue = require('../issues/issue')

function createIssueForEmpty(file) {
  return file.stats.size <= 0 && new Issue({ code: 99, file: file })
}
function clearNonIssues(x) {
  return x instanceof Issue
}

/**
 * validateMisc
 *
 * takes a list of files and returns an issue for each file
 */
module.exports = function validateMisc(miscFiles) {
  return new Promise(resolve =>
    resolve(miscFiles.map(createIssueForEmpty).filter(clearNonIssues)),
  )
}

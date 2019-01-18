const Issue = require('../issues/issue')

function createIssueForEmpty(file) {
  const size = typeof window !== 'undefined' ? file.size : file.stats.size
  return size <= 0 && new Issue({ code: 99, file: file })
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
  return Promise.resolve(
    miscFiles.map(createIssueForEmpty).filter(clearNonIssues),
  )
}

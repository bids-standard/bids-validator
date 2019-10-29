const Issue = require('../issues/issue')
const isNode = require('../isNode')

function createIssueForEmpty(file) {
  const size = !isNode ? file.size : file.stats.size
  var failsSizeRequirement = size <= 0
  // Exception misc files that can be valid although size==0
  // E.g., BadChannels and bad.segments in CTF data format (MEG modality)
  const exceptionMiscs = ['BadChannels', 'bad.segments']
  if (exceptionMiscs.indexOf(file.name) > -1) {
    failsSizeRequirement = false
  }

  return failsSizeRequirement && new Issue({ code: 99, file: file })
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

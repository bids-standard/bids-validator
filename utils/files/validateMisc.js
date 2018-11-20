const readFile = require('./readFile')
const Issue = require('../issues/issue')

/**
 * validateMisc
 *
 * takes a list of files and returns an issue for each file
 */
module.exports = function validateMisc(miscFiles) {
  const issuePromises = miscFiles.reduce(
    (issues, file) => [
      ...issues,
      readFile(file, false, null).catch(err => {
        if (err instanceof Issue) return err
        throw err
      }),
    ],
    [],
  )
  return (
    Promise.all(issuePromises)
      // remove non-issues
      .then(res => res.filter(o => o instanceof Issue))
  )
}

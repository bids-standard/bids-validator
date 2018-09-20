const utils = require('../../utils')
const bvec = require('./bvec')

const validate = (files, bContentsDict, issues) => {
  // validate bvec
  const bvecPromises = files.map(function(file) {
    return new Promise(resolve => {
      utils.files
        .readFile(file)
        .then(contents => {
          bContentsDict[file.relativePath] = contents
          bvec(file, contents, function(bvecIssues) {
            issues = issues.concat(bvecIssues)
            resolve()
          })
        })
        .catch(issue => {
          issues.push(issue)
          resolve()
        })
    })
  })

  return Promise.all(bvecPromises)
}

module.exports = validate

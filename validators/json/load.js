const utils = require('../../utils')

const load = (files, jsonFiles, jsonContentsDict, issues) => {
  const jsonPromises = files.map(function(file) {
    return new Promise(resolve => {
      utils.files
        .readFile(file)
        .then(contents => {
          utils.json.parse(file, contents, function(issues, jsObj) {
            issues = issues.concat(issues)

            // abort further tests if schema test does not pass
            if (issues.some(issue => issue.severity === 'error')) {
              return resolve()
            }

            jsonContentsDict[file.relativePath] = jsObj
            jsonFiles.push(file)
            resolve()
          })
        })
        .catch(issue => {
          issues.push(issue)
          resolve()
        })
    })
  })
  return Promise.all(jsonPromises)
}

module.exports = load

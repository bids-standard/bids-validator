const json = require('./json')
const utils = require('../../utils')
const Issue = utils.issues.Issue

const validate = (jsonFiles, fileList, jsonContentsDict, issues, summary) => {
  const jsonValidationPromises = jsonFiles.map(function(file) {
    return new Promise(resolve => {
      checkForAccompanyingDataFile(file, fileList, issues)
      json(file, jsonContentsDict, (issues, jsObj) => {
        issues = issues.concat(issues)
        collectTaskSummary(file, jsObj, summary)
        resolve()
      })
    })
  })

  return Promise.all(jsonValidationPromises)
}

const collectTaskSummary = (file, jsObj, summary) => {
  // collect task summary
  if (file.name.indexOf('task') > -1) {
    if (
      jsObj &&
      jsObj.TaskName &&
      summary.tasks.indexOf(jsObj.taskName) === -1
    ) {
      summary.tasks.push(jsObj.TaskName)
    }
  }
}

const checkForAccompanyingDataFile = (file, fileList, issues) => {
  // Verify that the json file has an accompanying data file
  // Need to limit checks to files in sub-*/**/ - Not all data dictionaries are sidecars
  const pathArgs = file.relativePath.split('/')
  const isSidecar =
    pathArgs[1].includes('sub-') && pathArgs.length > 3 ? true : false
  if (isSidecar) {
    // Check for suitable datafile accompanying this sidecar
    const dataFile = utils.bids_files.checkSidecarForDatafiles(file, fileList)
    if (!dataFile) {
      issues.push(
        new Issue({
          code: 90,
          file: file,
        }),
      )
    }
  }
}

module.exports = validate

const Issue = require('../../utils').issues.Issue

const checkDatasetDescription = fileList => {
  const issues = []
  const fileKeys = Object.keys(fileList)
  const hasDatasetDescription = fileKeys.some(key => {
    const file = fileList[key]
    return file.relativePath && file.relativePath == '/dataset_description.json'
  })
  if (!hasDatasetDescription) {
    issues.push(new Issue({ code: 57 }))
  }
  return issues
}
module.exports = checkDatasetDescription

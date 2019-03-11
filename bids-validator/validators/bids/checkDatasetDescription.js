const Issue = require('../../utils').issues.Issue

const checkDatasetDescription = jsonContentsDict => {
  let issues = []
  const jsonFilePaths = Object.keys(jsonContentsDict)
  const hasDatasetDescription = jsonFilePaths.some(path => {
    return path == '/dataset_description.json'
  })
  if (!hasDatasetDescription) {
    issues.push(new Issue({ code: 57 }))
  } else {
    const datasetDescription = jsonContentsDict['/dataset_description.json']

    // check to ensure that the dataset description Authors are
    // properly formatted
    issues = issues.concat(checkAuthorField(datasetDescription.Authors))
  }
  return issues
}

const checkAuthorField = authors => {
  const issues = []
  // because this test happens before schema validation,
  // we have to make sure that authors is an array with length > 0
  if (authors && typeof authors == 'object' && authors.length) {
    authors.forEach(author => {
      // each author field should have no more than one comma
      if (author.split(',').length >= 2) {
        issues.push(new Issue({ code: 102 }))
      }
    })
  }
  return issues
}
module.exports = checkDatasetDescription

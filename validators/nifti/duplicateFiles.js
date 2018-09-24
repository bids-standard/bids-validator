const Issue = require('../../utils').issues.Issue

const duplicateNiftis = (files, issues) => {
  // check if same file with .nii and .nii.gz extensions is present
  const niftiCounts = files
    .map(function(val) {
      return { count: 1, val: val.name.split('.')[0] }
    })
    .reduce(function(a, b) {
      a[b.val] = (a[b.val] || 0) + b.count
      return a
    }, {})

  const duplicates = Object.keys(niftiCounts).filter(function(a) {
    return niftiCounts[a] > 1
  })
  for (let key in duplicates) {
    const duplicateFiles = files.filter(function(a) {
      return a.name.split('.')[0] === duplicates[key]
    })
    for (let file in duplicateFiles) {
      issues.push(
        new Issue({
          code: 74,
          file: duplicateFiles[file],
        }),
      )
    }
  }
}

module.exports = duplicateNiftis

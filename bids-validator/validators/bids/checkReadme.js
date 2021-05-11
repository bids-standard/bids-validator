import isNode from '../../utils/isNode'

const Issue = require('../../utils').issues.Issue

const checkReadme = fileList => {
  const issues = []
  const fileKeys = Object.keys(fileList)
  const hasReadme = fileKeys.some(key => {
    const file = fileList[key]
    return file.relativePath && file.relativePath == '/README'
  })
  if (!hasReadme) {
    issues.push(new Issue({ code: 101 }))
  } else {
    // Get the README file object
    for (var key in fileList) {
      if (fileList[key].name == 'README') {
        var readmeFile = fileList[key]
        break
      }
    }

    // Check size and raise warning if too small
    const size = !isNode ? readmeFile.size : readmeFile.stats.size
    var failsSizeRequirement = size <= 5000
    if (failsSizeRequirement) {
      issues.push(new Issue({ code: 101 }))
    }
  }
  return issues
}
export default checkReadme

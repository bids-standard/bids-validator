const fs = require('fs')

const collectDirectorySize = fileList => {
  let size = 0
  const keys = Object.keys(fileList)
  keys.forEach(key => {
    let file = fileList[key]
    // collect file stats
    if (typeof window !== 'undefined' && file.size) {
      size += file.size
    } else {
      file.stats = getFileStats(file)
      size += file.stats.size
    }
  })
  return size
}

const getFileStats = file => {
  let stats
  if (!file.stats) {
    try {
      stats = fs.statSync(file.path)
    } catch (err) {
      stats = { size: 0 }
    }
  }
  return stats
}

module.exports = collectDirectorySize

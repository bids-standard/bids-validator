const async = require('async')
const fs = require('fs')

const collectDirectoryStatistics = (fileList, summary) => {
  async.eachOfLimit(fileList, 200, function(file) {
    // collect file stats
    if (typeof window !== 'undefined' && file.size) {
      summary.size += file.size
    } else {
      file.stats = getFileStats(file)
      summary.size += file.stats.size
    }
  })
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

module.exports = collectDirectoryStatistics

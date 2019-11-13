const fs = require('fs')

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

module.exports = getFileStats

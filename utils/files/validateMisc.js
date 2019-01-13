const Issue = require('../issues/issue')
const pLimit = require('p-limit')
const fs = require('fs')
const limit = pLimit(200)

const isNode = typeof window === 'undefined'

async function checkForData(filepath) {
  return new Promise(resolve => {
    try {
      if (isNode) {
        const stream = fs.createReadStream(filepath, {
          encoding: 'utf8',
          highWaterMark: 1,
        })
        let hasData = false
        stream.on('data', () => {
          // only called if file contains data
          // else stream is closed immediately
          hasData = true
          // kill stream once data confirmed
          stream.destroy()
        })
        stream.on('close', () => {
          resolve(hasData)
        })
      } else {
        resolve(true)
      }
    } catch (err) {
      // throws error if file not found
      resolve(false)
    }
  })
}

/**
 * validateMisc
 *
 * takes a list of files and returns an issue for each file
 */
module.exports = function validateMisc(miscFiles) {
  console.log('VALIDATING MISC')
  console.log('# of misc files: ', miscFiles.length)
  // console.log('misc files: ', miscFiles)
  const issuePromises = miscFiles.reduce(
    (issues, file) => [
      ...issues,
      checkForData(file.path)
        // if no data, create file read error
        .then(hasData => !hasData && new Issue({ code: 44, file: file })),
    ],
    [],
  )
  return (
    Promise.all(issuePromises)
      // remove non-issues
      .then(res => res.filter(o => o instanceof Issue))
  )
}

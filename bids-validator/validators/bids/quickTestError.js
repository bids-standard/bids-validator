import path from 'path'
import utils from '../../utils'
const Issue = utils.issues.Issue
import isNode from '../../utils/isNode'

/*
 * Generates an error for quickTest failures
 */
const quickTestError = function(dir) {
  let filename
  if (isNode) {
    // For Node, grab the path from the dir string
    filename = path.basename(dir)
  } else {
    filename = constructFileName(dir)
  }
  const issue = new Issue({
    code: 61,
    file: {
      name: filename,
      path: path.join('.', filename),
      relativePath: path.join('', filename),
    },
  })
  return issue
}

const constructFileName = dir => {
  let filename
  // Browser side we need to look it up more carefully
  if (dir.length && 'webkitRelativePath' in dir[0]) {
    let wrp = dir[0].webkitRelativePath
    while (wrp.indexOf(path.sep) !== -1) {
      wrp = path.dirname(wrp)
    }
    filename = wrp
  } else {
    // Fallback for non-standard webkitRelativePath
    filename = 'uploaded-directory'
  }
  return filename
}

export default quickTestError

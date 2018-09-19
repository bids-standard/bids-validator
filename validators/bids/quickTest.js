/**
 * Quick Test
 *
 * A quick test to see if it could be a BIDS
 * dataset based on structure/naming. If it
 * could be it will trigger the full validation
 * otherwise it will throw a callback with a
 * generic error.
 */
const quickTest = (fileList, options) => {
  let couldBeBIDS = false
  for (let key in fileList) {
    if (fileList.hasOwnProperty(key)) {
      const file = fileList[key]
      let path = file.relativePath
      if (path) {
        path = path.split('/')
        path = path.reverse()

        let isCorrectModality = false
        // MRI
        if (
          path[0].includes('.nii') &&
          ['anat', 'func', 'dwi'].indexOf(path[1]) != -1
        ) {
          isCorrectModality = true
        }
        // MEG
        else if (path[0].includes('.json') && ['meg'].indexOf(path[1]) != -1) {
          isCorrectModality = true
        }
        // EEG
        else if (
          path[0].includes('.json') &&
          ['eeg'].indexOf(path[1]) != -1 &&
          options.bep006
        ) {
          isCorrectModality = true
        }
        // iEEG
        else if (
          path[0].includes('.json') &&
          ['ieeg'].indexOf(path[1]) != -1 &&
          options.bep010
        ) {
          isCorrectModality = true
        }

        if (
          path[2] &&
          (path[2].indexOf('ses-') == 0 || path[2].indexOf('sub-') == 0) &&
          isCorrectModality
        ) {
          couldBeBIDS = true
          break
        }
      }
    }
  }
  return couldBeBIDS
}

module.exports = quickTest

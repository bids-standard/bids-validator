/**
 * Utility functions for checking bids file structures
 * eg. corresponding files
 */
// dependencies -------------------------------------------------------------------
var files = require('./files')

// public API ---------------------------------------------------------------------
const bidsFileUtils = {
  checkSidecarForDatafiles: checkSidecarForDatafiles,
}

// implementations ----------------------------------------------------------------
/**
 * Verify that JSON sidecars have corresponding data files
 */
function checkSidecarForDatafiles(file, fileList) {
  const noExt = file.relativePath.replace('.json', '')
  const dictPath = noExt.substring(0, noExt.lastIndexOf('/') + 1)
  const dictName = noExt.substring(noExt.lastIndexOf('/') + 1, noExt.length)
  const dictArgs = dictName.split('_')
  const idxs = Object.keys(fileList)
  let dataFile = false
  // Iterate file paths from file list
  for (let i of idxs) {
    const path = fileList[i].relativePath
    if (path.includes(dictPath)) {
      let argMatch = true
      for (let j in dictArgs) {
        // Only use arg if it's a string and not 'coordsystem' since that doesn't appear in the datafiles
        if (typeof dictArgs[j] === 'string' && dictArgs[j] != 'coordsystem') {
          if (!path.includes(dictArgs[j])) {
            argMatch = false
            break
          }
        }
      }
      if (argMatch) {
        // Make sure it's not the data dictionary itself
        if (fileList[i].relativePath != file.relativePath) {
          // Test that it's a valid data file format
          if (files.dataExtRE().test(fileList[i].name)) {
            dataFile = true
            break
          }
          // MEG datafiles may be a folder, therefore not contained in fileList, will need to look in paths
          if (noExt.endsWith('_meg') || noExt.endsWith('_coordsystem')) {
            // Check for folder ending in meg.ds
            if (fileList[i].relativePath.includes('_meg.ds')) {
              dataFile = true
              break
            }
          }
        }
      }
    }
  }
  return dataFile
}

module.exports = bidsFileUtils

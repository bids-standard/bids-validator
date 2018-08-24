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
        if (
          typeof dictArgs[j] === 'string' &&
          dictArgs[j] != 'coordsystem' &&
          !path.includes(dictArgs[j])
        ) {
          argMatch = false
          break
        }
      }
      if (argMatch) {
        dataFile = verifyDatafileMatch(file.relativePath, noExt, fileList[i])
        if (dataFile) {
          break
        }
      }
    }
  }
  return dataFile
}

/**
 * Accepts path to sidecar file, the sidecar filename without extension
 * and the datafile that's a potential match
 * Returns boolean indicating if file evaluates as valid datafile
 */
function verifyDatafileMatch(sidecarPath, noExt, matchFile) {
  let match = false
  // Make sure it's not the data dictionary itself
  if (matchFile.relativePath != sidecarPath) {
    //console.log('Sidecar: ' + sidecarPath + ', Match path: ' + matchFile.relativePath)
    // Test that it's a valid data file format
    if (files.dataExtRE().test(matchFile.name)) {
      //console.log('Its not itself')
      match = true
      //break
    }
    // MEG datafiles may be a folder, therefore not contained in fileList, will need to look in paths
    if (!match && (noExt.endsWith('_meg') || noExt.endsWith('_coordsystem'))) {
      // Check for folder ending in meg.ds
      if (matchFile.relativePath.includes('_meg.ds')) {
        match = true
        //break
      }
    }
  }
  return match
}

module.exports = bidsFileUtils

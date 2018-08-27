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
  const dictName = noExt.substring(noExt.lastIndexOf('/') + 1, noExt.length)
  const args = {
    dictArgs: dictName.split('_'),
    dictName: dictName,
    dictPath: noExt.substring(0, noExt.lastIndexOf('/') + 1),
    file: file,
    fileList: fileList,
    noExt: noExt,
  }
  const idxs = Object.keys(fileList)
  // Check each file in fileList for potential match - return true on first match
  let dataFile = idxs.some(checkFileListForMatch, [args])
  return dataFile
}

/**
 * Check file list for first valid match for sidecar file
 */
function checkFileListForMatch(i) {
  const args = this[0]
  const path = args.fileList[i].relativePath
  let match = false
  // Only proceed if path includes the path to sidecar
  let dictArgs = path.includes(args.dictPath) ? args.dictArgs : []
  let argMatch = false
  for (let j of dictArgs) {
    argMatch = true
    if (typeof j === 'string' && j != 'coordsystem' && !path.includes(j)) {
      argMatch = false
      break
    }
  }
  if (argMatch) {
    match = verifyDatafileMatch(
      args.file.relativePath,
      args.noExt,
      args.fileList[i],
    )
  }
  return match
}

/**
 * Accepts path to sidecar file, the sidecar filename without extension
 * and the datafile that's a potential match
 * Returns boolean indicating if file evaluates as valid datafile
 */
function verifyDatafileMatch(sidecarPath, noExt, matchFile) {
  let match = false
  let megDs = false
  // Make sure it's not the data dictionary itself
  const isSelf = matchFile.relativePath === sidecarPath
  if (!isSelf && files.dataExtRE().test(matchFile.name)) {
    match = true
  }
  // MEG datafiles may be a folder, therefore not contained in fileList, will need to look in paths
  if (
    !isSelf &&
    !match &&
    (noExt.endsWith('_meg') || noExt.endsWith('_coordsystem'))
  ) {
    megDs = matchFile.relativePath.includes('_meg.ds')
  }
  if (megDs) {
    match = true
  }
  return match
}

module.exports = bidsFileUtils

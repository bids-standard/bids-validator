// dependencies -------------------------------------------------------------------

const FileAPI = require('./FileAPI')
const newFile = require('./newFile')
const readFile = require('./readFile')
const readNiftiHeader = require('./readNiftiHeader')
const readDir = require('./readDir')
const potentialLocations = require('./potentialLocations')
const generateMergedSidecarDict = require('./generatedMergedSidecarDict')
const getBFileContent = require('./getBFileContent')

// public API ---------------------------------------------------------------------

var fileUtils = {
  FileAPI: FileAPI,
  newFile: newFile,
  readFile: readFile,
  readDir: readDir,
  readNiftiHeader: readNiftiHeader,
  generateMergedSidecarDict: generateMergedSidecarDict,
  potentialLocations: potentialLocations,
  getBFileContent: getBFileContent,
}

module.exports = fileUtils

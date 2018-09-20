const utils = require('../../utils')

const collectSubjects = (fileList, options, summary) => {
  const fileKeys = Object.keys(fileList)
  fileKeys.forEach(key => {
    const file = fileList[key]
    if (
      !utils.type.file.isStimuliData(file.relativePath) &&
      utils.type.isBIDS(file.relativePath, options.bep006, options.bep010)
    ) {
      const pathValues = utils.type.getPathValues(file.relativePath)
      const isEmptyRoom = pathValues.sub && pathValues.sub == 'emptyroom'

      if (
        pathValues.sub &&
        summary.subjects.indexOf(pathValues.sub) === -1 &&
        !isEmptyRoom
      ) {
        summary.subjects.push(pathValues.sub)
      }
    }
  })
}

module.exports = collectSubjects

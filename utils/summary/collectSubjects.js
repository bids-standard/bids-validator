const type = require('../type')

const collectSubjects = (fileList, options) => {
  let subjects = []
  const fileKeys = Object.keys(fileList)
  fileKeys.forEach(key => {
    const file = fileList[key]
    if (
      !type.file.isStimuliData(file.relativePath) &&
      type.isBIDS(file.relativePath, options.bep006, options.bep010)
    ) {
      const pathValues = type.getPathValues(file.relativePath)
      const isEmptyRoom = pathValues.sub && pathValues.sub == 'emptyroom'

      if (
        pathValues.sub &&
        subjects.indexOf(pathValues.sub) === -1 &&
        !isEmptyRoom
      ) {
        subjects.push(pathValues.sub)
      }
    }
  })
  return subjects
}

module.exports = collectSubjects

const utils = require('../../utils')

const collectSessions = (fileList, options, summary) => {
  Object.keys(fileList).forEach(key => {
    const file = fileList[key]
    if (
      !utils.type.file.isStimuliData(file.relativePath) &&
      utils.type.isBIDS(file.relativePath, options.bep006, options.bep010)
    ) {
      const pathValues = utils.type.getPathValues(file.relativePath)
      const isEmptyRoom = pathValues.sub && pathValues.sub == 'emptyroom'

      if (
        pathValues.ses &&
        summary.sessions.indexOf(pathValues.ses) === -1 &&
        !isEmptyRoom
      ) {
        summary.sessions.push(pathValues.ses)
      }
    }
  })
}

module.exports = collectSessions

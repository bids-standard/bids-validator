const type = require('../type')

const collectSessions = (fileList, options) => {
  const sessions = []
  Object.keys(fileList).forEach(key => {
    const file = fileList[key]
    if (
      !type.file.isStimuliData(file.relativePath) &&
      type.isBIDS(file.relativePath, options.bep006, options.bep010)
    ) {
      const pathValues = type.getPathValues(file.relativePath)
      const isEmptyRoom = pathValues.sub && pathValues.sub == 'emptyroom'

      if (
        pathValues.ses &&
        sessions.indexOf(pathValues.ses) === -1 &&
        !isEmptyRoom
      ) {
        sessions.push(pathValues.ses)
      }
    }
  })
  return sessions
}

module.exports = collectSessions

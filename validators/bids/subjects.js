const utils = require('../../utils')
const Issue = utils.issues.Issue

const participantsInSubjects = (participants, subjects) => {
  const issues = []
  if (participants) {
    const participantsFromFile = participants.list.sort()
    const participantsFromFolders = subjects.sort()
    if (
      !utils.array.equals(participantsFromFolders, participantsFromFile, true)
    ) {
      issues.push(
        new Issue({
          code: 49,
          evidence:
            'participants.tsv: ' +
            participantsFromFile.join(', ') +
            ' folder structure: ' +
            participantsFromFolders.join(', '),
          file: participants.file,
        }),
      )
    }
  }
  return issues
}

const atLeastOneSubject = fileList => {
  const issues = []
  const fileKeys = Object.keys(fileList)
  const hasSubjectDir = fileKeys.some(key => {
    const file = fileList[key]
    return file.relativePath && file.relativePath.startsWith('/sub-')
  })
  if (!hasSubjectDir) {
    issues.push(new Issue({ code: 45 }))
  }
  return issues
}

module.exports = {
  participantsInSubjects,
  atLeastOneSubject,
}

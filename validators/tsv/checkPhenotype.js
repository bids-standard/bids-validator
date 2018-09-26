const utils = require('../../utils')
const Issue = utils.issues.Issue

const checkPhenotype = (phenotypeParticipants, summary) => {
  const issues = []
  for (let j = 0; j < phenotypeParticipants.length; j++) {
    const fileParticpants = phenotypeParticipants[j]
    if (
      phenotypeParticipants &&
      phenotypeParticipants.length > 0 &&
      !utils.array.equals(fileParticpants.list, summary.subjects.sort(), true)
    ) {
      issues.push(
        new Issue({
          code: 51,
          evidence:
            fileParticpants.file +
            '- ' +
            fileParticpants.list +
            '  Subjects -' +
            fileParticpants,
          file: fileParticpants.file,
        }),
      )
    }
  }
  return issues
}

module.exports = checkPhenotype

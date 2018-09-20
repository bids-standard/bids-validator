const utils = require('../../utils')
const Issue = utils.issues.Issue

const checkPhenotype = (phenotypeParticipants, summary, issues) => {
  for (var j = 0; j < phenotypeParticipants.length; j++) {
    var fileParticpants = phenotypeParticipants[j]
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
}

module.exports = checkPhenotype

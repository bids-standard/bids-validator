const utils = require('../../utils')
const tsv = require('./tsv')

const validate = (
  files,
  fileList,
  tsvs,
  events,
  participants,
  phenotypeParticipants,
  stimuli,
  issues,
) => {
  // validate tsv
  const tsvPromises = files.map(function(file) {
    return new Promise(resolve => {
      utils.files
        .readFile(file)
        .then(contents => {
          // Push TSV to list for custom column verification after all data dictionaries have been read
          tsvs.push({
            file: file,
            contents: contents,
          })
          if (file.name.endsWith('_events.tsv')) {
            events.push({
              file: file,
              path: file.relativePath,
              contents: contents,
            })
          }
          tsv.TSV(file, contents, fileList, function(
            issues,
            participantList,
            stimFiles,
          ) {
            if (participantList) {
              if (file.name.endsWith('participants.tsv')) {
                participants = {
                  list: participantList,
                  file: file,
                }
              } else if (file.relativePath.includes('phenotype/')) {
                phenotypeParticipants.push({
                  list: participantList,
                  file: file,
                })
              }
            }
            if (stimFiles && stimFiles.length) {
              // add unique new events to the stimuli.events array
              stimuli.events = [...new Set([...stimuli.events, ...stimFiles])]
            }
            issues = issues.concat(issues)
            return resolve()
          })
        })
        .catch(issue => {
          issues = issues.concat(issue)
          return resolve()
        })
    })
  })

  return Promise.all(tsvPromises)
}

module.exports = validate

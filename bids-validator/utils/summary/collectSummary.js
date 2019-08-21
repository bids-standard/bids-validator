const files = require('../files')
const collectModalities = require('./collectModalities')
const collectSessions = require('./collectSessions')
const collectSubjects = require('./collectSubjects')
const Metadata = require('./metadata')

const collectSummary = (fileList, options) => {
  // remove ignored files from list:
  Object.keys(fileList).forEach(function(key) {
    if (fileList[key].ignore) {
      delete fileList[key]
    }
  })

  const summary = {
    sessions: [],
    subjects: [],
    tasks: [],
    modalities: [],
    totalFiles: Object.keys(fileList).length,
    size: 0,
    metadata: new Metadata(),
  }

  //collect file directory statistics
  summary.size = files.collectDirectorySize(fileList)

  // collect modalities for summary
  summary.modalities = collectModalities(fileList)

  // collect subjects
  summary.subjects = collectSubjects(fileList, options)

  // collect sessions
  summary.sessions = collectSessions(fileList, options)

  // collect metadata in summary
  summary.metadata.collectFromSummary(summary)

  return summary
}

module.exports = collectSummary

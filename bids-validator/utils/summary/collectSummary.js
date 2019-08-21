const files = require('../files')
const collectModalities = require('./collectModalities')
const collectSessions = require('./collectSessions')
const collectSubjects = require('./collectSubjects')

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
    metadata: {
      /* openneuro specific */
      // datasetId: 'ID!',
      // datasetUrl: 'String',
      // firstSnapshotCreatedAt: 'DateTime',
      // latestSnapshotCreatedAt: 'DateTime',
      // adminUsers: null, //'String'
      //
      /* not intrinsic to data */
      // associatedPaperDOI: null, //'String'
      // openneuroPaperDOI: null, //'String'
      // ages: null, //'String'
      // notes: null, //'String'
      //
      /* extractable */
      datasetName: null, //'String'
      subjectCount: null, //'Int'
      trialCount: null, //'Int'
      dataProcessed: null, //'String'
      seniorAuthor: null, //'PersonNameInput'
      //
      /* not sure if extractable */
      // modalities: null, //'[String]'
      // dxStatus: null, //'[String]'
      // tasksCompleted: null, //'Boolean'
      // studyDesign: null, //'String'
      // studyDomain: null, //'String'
      // studyLongitudinal: null, //'String'
      // species: null, //'String'
    },
  }

  //collect file directory statistics
  summary.size = files.collectDirectorySize(fileList)

  // collect modalities for summary
  summary.modalities = collectModalities(fileList)

  // collect subjects
  summary.subjects = collectSubjects(fileList, options)

  // collect sessions
  summary.sessions = collectSessions(fileList, options)

  return summary
}

module.exports = collectSummary

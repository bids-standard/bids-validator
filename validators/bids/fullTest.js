const BIDS = require('./obj')
const utils = require('../../utils')
const Issue = utils.issues.Issue
const tsv = require('../tsv')
const json = require('../json')
const NIFTI = require('../nifti')
const bval = require('../bval')
const bvec = require('../bvec')
const Events = require('../events')
const session = require('../session')
const checkAnyDataPresent = require('../checkAnyDataPresent')
const headerFields = require('../headerFields')
const subSesMismatchTest = require('./subSesMismatchTest')
const groupFileTypes = require('./groupFileTypes')
const collectModalities = require('./collectModalities')
const collectSessions = require('./collectSessions')
const subjects = require('./subjects')
const checkDatasetDescription = require('./checkDatasetDescription')

/**
 * Full Test
 *
 * Takes on an array of files and starts
 * the validation process for a BIDS
 * package.
 */
const fullTest = (fileList, options, callback) => {
  let self = BIDS
  self.options = options

  let jsonContentsDict = {},
    bContentsDict = {},
    events = [],
    stimuli = {
      events: [],
      directory: [],
    },
    jsonFiles = [],
    headers = [],
    participants = null,
    phenotypeParticipants = []

  let tsvs = []

  let summary = {
    sessions: [],
    subjects: [],
    tasks: [],
    modalities: [],
    totalFiles: Object.keys(fileList).length,
    size: 0,
  }

  //collect file directory statistics
  summary.size = utils.files.collectDirectoryStatistics(fileList)

  // remove ignored files from list:
  Object.keys(fileList).forEach(function(key) {
    if (fileList[key].ignore) {
      delete fileList[key]
    }
  })

  self.issues = self.issues.concat(subSesMismatchTest(fileList))

  // check for illegal character in task name and acq name
  self.issues = self.issues.concat(utils.files.illegalCharacterTest(fileList))

  const files = groupFileTypes(fileList, self.options)

  // generate issues for all files that do not comply with
  // bids spec
  files.invalid.map(function(file) {
    self.issues.push(
      new Issue({
        file: file,
        evidence: file.name,
        code: 1,
      }),
    )
  })

  // collect modalities for summary
  summary.modalities = collectModalities(fileList)

  // check if dataset contains T1w
  if (summary.modalities.indexOf('T1w') < 0) {
    self.issues.push(
      new Issue({
        code: 53,
      }),
    )
  }

  // SECTION: TSV
  // collect tsv issues
  tsv
    .validate(
      files.tsv,
      fileList,
      tsvs,
      events,
      participants,
      phenotypeParticipants,
      stimuli,
    )
    .then(tsvIssues => {
      self.issues = self.issues.concat(tsvIssues)

      // SECTION: BVEC
      // collect bvec issues
      bvec.validate(files.bvec, bContentsDict).then(bvecIssues => {
        self.issues = self.issues.concat(bvecIssues)

        // SECTION: BVAL
        // collect bval issues
        bval.validate(files.bval, bContentsDict).then(bvalIssues => {
          self.issues = self.issues.concat(bvalIssues)

          // SECTION: JSON
          // load json files and construct a contents object with field, value pairs
          json
            .load(files.json, jsonFiles, jsonContentsDict)
            .then(jsonLoadIssues => {
              self.issues = self.issues.concat(jsonLoadIssues)

              // check for at least one subject
              const noSubjectIssues = subjects.atLeastOneSubject(fileList)
              self.issues = self.issues.concat(noSubjectIssues)

              // check for datasetDescription file in the proper place
              const datasetDescriptionIssues = checkDatasetDescription(fileList)
              self.issues = self.issues.concat(datasetDescriptionIssues)

              // collect subjects
              summary.subjects = subjects.collectSubjects(
                fileList,
                self.options,
              )

              // collect sessions
              summary.sessions = collectSessions(fileList, self.options)

              // validate json files and contents
              json
                .validate(jsonFiles, fileList, jsonContentsDict, summary)
                .then(jsonIssues => {
                  self.issues = self.issues.concat(jsonIssues)

                  // SECTION: NIFTI
                  // general nifti validation
                  NIFTI.validate(
                    files.nifti,
                    fileList,
                    self.options,
                    jsonContentsDict,
                    bContentsDict,
                    events,
                    headers,
                  ).then(niftiIssues => {
                    self.issues = self.issues.concat(niftiIssues)

                    // SECTION: PARTICIPANTS
                    // issues related to participants not listed in the subjects list
                    const participantsInSubjectsIssues = subjects.participantsInSubjects(
                      participants,
                      summary.subjects,
                    )
                    self.issues = self.issues.concat(
                      participantsInSubjectsIssues,
                    )

                    //check for equal number of participants from ./phenotype/*.tsv and participants in dataset
                    const phenotypeIssues = tsv.checkPhenotype(
                      phenotypeParticipants,
                      summary,
                    )
                    self.issues = self.issues.concat(phenotypeIssues)

                    // validate nii header fields
                    self.issues = self.issues.concat(headerFields(headers))

                    // SECTION: EVENTS
                    // Events validation
                    stimuli.directory = files.stimuli
                    const eventsIssues = Events.validateEvents(
                      events,
                      stimuli,
                      headers,
                      jsonContentsDict,
                      self.issues,
                    )
                    self.issues = self.issues.concat(eventsIssues)

                    // SECTION: TSV COLUMNS
                    // validate custom fields in all TSVs and add any issues to the list
                    self.issues = self.issues.concat(
                      tsv.validateTsvColumns(tsvs, jsonContentsDict),
                    )

                    // SECTION: SESSIONS
                    // validation session files
                    self.issues = self.issues.concat(session(fileList))

                    // SECTION: SUBJECT DATA PRESENT
                    self.issues = self.issues.concat(
                      checkAnyDataPresent(fileList, summary.subjects),
                    )
                    summary.modalities = utils.modalities.group(
                      summary.modalities,
                    )
                    const issues = utils.issues.format(
                      self.issues,
                      summary,
                      self.options,
                    )
                    callback(issues, summary)
                  })
                })
            })
        })
      })
    })
}

module.exports = fullTest

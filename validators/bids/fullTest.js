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
  utils.files.collectDirectoryStatistics(fileList, summary)

  // remove ignored files from list:
  Object.keys(fileList).forEach(function(key) {
    if (fileList[key].ignore) {
      delete fileList[key]
    }
  })

  self.issues = self.issues.concat(subSesMismatchTest(fileList))

  // check for illegal character in task name and acq name
  utils.files.illegalCharacterTest(fileList, self.issues)

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
  collectModalities(fileList, summary)

  // check if dataset contains T1w
  if (summary.modalities.indexOf('T1w') < 0) {
    self.issues.push(
      new Issue({
        code: 53,
      }),
    )
  }

  // load json data for validation later

  tsv
    .validate(
      files.tsv,
      fileList,
      tsvs,
      events,
      participants,
      phenotypeParticipants,
      stimuli,
      self.issues,
    )
    .then(() => bvec.validate(files.bvec, bContentsDict, self.issues))
    .then(() => bval.validate(files.bval, bContentsDict, self.issues))
    .then(() => json.load(files.json, jsonFiles, jsonContentsDict, self.issues))
    .then(() => {
      // check for at least one subject
      subjects.atLeastOneSubject(fileList, self.issues)

      // check for datasetDescription file in the proper place
      checkDatasetDescription(fileList, self.issues)

      // collect subjects
      subjects.collectSubjects(fileList, self.options, summary)

      // collect sessions
      collectSessions(fileList, self.options, summary)

      json
        .validate(jsonFiles, fileList, jsonContentsDict, self.issues, summary)
        .then(function() {
          // SECTION: NIFTI
          // check for duplicate nifti files
          NIFTI.duplicateFiles(files.nifti, self.issues)

          // Check for _fieldmap nifti exists without corresponding _magnitude
          NIFTI.fieldmapWithoutMagnitude(files.nifti, self.issues)

          // Check for _phasediff nifti without associated _magnitude1 files
          NIFTI.phasediffWithoutMagnitude(files.nifti, self.issues)

          const niftiPromises = files.nifti.map(function(file) {
            return new Promise(function(resolve) {
              if (self.options.ignoreNiftiHeaders) {
                NIFTI.nifti(
                  null,
                  file,
                  jsonContentsDict,
                  bContentsDict,
                  fileList,
                  events,
                  function(issues) {
                    self.issues = self.issues.concat(issues)
                    resolve()
                  },
                )
              } else {
                utils.files.readNiftiHeader(file, function(header) {
                  // check if header could be read
                  if (header && header.hasOwnProperty('error')) {
                    self.issues.push(header.error)
                    resolve()
                  } else {
                    headers.push([file, header])
                    NIFTI.nifti(
                      header,
                      file,
                      jsonContentsDict,
                      bContentsDict,
                      fileList,
                      events,
                      function(issues) {
                        self.issues = self.issues.concat(issues)
                        resolve()
                      },
                    )
                  }
                })
              }
            })
          })
          Promise.all(niftiPromises).then(function() {
            // check if participants file match found subjects
            subjects.participantsInSubjects(
              participants,
              summary.subjects,
              self.issues,
            )

            //check for equal number of participants from ./phenotype/*.tsv and participants in dataset
            tsv.checkPhenotype(phenotypeParticipants, summary, self.issues)

            // validate nii header fields
            self.issues = self.issues.concat(headerFields(headers))

            // SECTION: EVENTS
            // Events validation
            stimuli.directory = files.stimuli
            Events.validateEvents(
              events,
              stimuli,
              headers,
              jsonContentsDict,
              self.issues,
            )

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
            summary.modalities = utils.modalities.group(summary.modalities)
            const issues = utils.issues.format(
              self.issues,
              summary,
              self.options,
            )
            callback(issues, summary)
          })
        })
    })
}

module.exports = fullTest

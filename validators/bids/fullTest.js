const BIDS = require('./obj')
const utils = require('../../utils')
const Issue = utils.issues.Issue
const tsv = require('../tsv')
const json = require('../json')
const NIFTI = require('../nii')
const bval = require('../bval')
const bvec = require('../bvec')
const Events = require('../events')
const session = require('../session')
const checkAnyDataPresent = require('../checkAnyDataPresent')
const headerFields = require('../headerFields')
const subSesMismatchTest = require('./subSesMismatchTest')
const groupFileTypes = require('./groupFileTypes')
const collectModalities = require('./collectModalities')
const collectSubjects = require('./collectSubjects')
const collectSessions = require('./collectSessions')

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

  const fileKeys = Object.keys(fileList)

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

  // validate bval
  const bvalPromises = files.bval.map(function(file) {
    return new Promise(resolve => {
      utils.files
        .readFile(file)
        .then(contents => {
          bContentsDict[file.relativePath] = contents
          bval(file, contents, function(issues) {
            self.issues = self.issues.concat(issues)
            resolve()
          })
        })
        .catch(issue => {
          self.issues.push(issue)
          resolve()
        })
    })
  })

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
    .then(() => Promise.all(bvalPromises))
    .then(() => json.load(files.json, jsonFiles, jsonContentsDict, self.issues))
    .then(() => {
      // check for at least one subject
      const hasSubjectDir = fileKeys.some(key => {
        const file = fileList[key]
        return file.relativePath && file.relativePath.startsWith('/sub-')
      })
      if (!hasSubjectDir) {
        self.issues.push(new Issue({ code: 45 }))
      }

      // check for datasetDescription file in the proper place
      const hasDatasetDescription = fileKeys.some(key => {
        const file = fileList[key]
        return (
          file.relativePath && file.relativePath == '/dataset_description.json'
        )
      })
      if (!hasDatasetDescription) {
        self.issues.push(new Issue({ code: 57 }))
      }

      // collect subjects
      collectSubjects(fileList, self.options, summary)

      // collect sessions
      collectSessions(fileList, self.options, summary)

      json
        .validate(jsonFiles, fileList, jsonContentsDict, self.issues, summary)
        .then(function() {
          // SECTION: NIFTI
          // check if same file with .nii and .nii.gz extensions is present
          const niftiCounts = files.nifti
            .map(function(val) {
              return { count: 1, val: val.name.split('.')[0] }
            })
            .reduce(function(a, b) {
              a[b.val] = (a[b.val] || 0) + b.count
              return a
            }, {})

          const duplicates = Object.keys(niftiCounts).filter(function(a) {
            return niftiCounts[a] > 1
          })
          if (duplicates.length !== 0) {
            for (let key in duplicates) {
              const duplicateFiles = files.nifti.filter(function(a) {
                return a.name.split('.')[0] === duplicates[key]
              })
              for (let file in duplicateFiles) {
                self.issues.push(
                  new Issue({
                    code: 74,
                    file: duplicateFiles[file],
                  }),
                )
              }
            }
          }
          // Check for _fieldmap nifti exists without corresponding _magnitude
          // TODO: refactor into external function call
          const niftiNames = files.nifti.map(nifti => nifti.name)
          const fieldmaps = niftiNames.filter(
            nifti => nifti.indexOf('_fieldmap') > -1,
          )
          const magnitudes = niftiNames.filter(
            nifti => nifti.indexOf('_magnitude') > -1,
          )
          fieldmaps.map(nifti => {
            const associatedMagnitudeFile = nifti.replace(
              'fieldmap',
              'magnitude',
            )
            if (magnitudes.indexOf(associatedMagnitudeFile) === -1) {
              self.issues.push(
                new Issue({
                  code: 91,
                  file: files.nifti.find(niftiFile => niftiFile.name == nifti),
                }),
              )
            }
          })
          // End fieldmap check

          // check to see if each phasediff is associated with magnitude1
          const phaseDiffNiftis = niftiNames.filter(
            nifti => nifti.indexOf('phasediff') > -1,
          )
          const magnitude1Niftis = niftiNames.filter(
            nifti => nifti.indexOf('magnitude1') > -1,
          )
          phaseDiffNiftis.map(nifti => {
            const associatedMagnitudeFile = nifti.replace(
              'phasediff',
              'magnitude1',
            )
            if (magnitude1Niftis.indexOf(associatedMagnitudeFile) === -1) {
              self.issues.push(
                new Issue({
                  code: 92,
                  file: files.nifti.find(niftiFile => niftiFile.name == nifti),
                }),
              )
            }
          })
          const niftiPromises = files.nifti.map(function(file) {
            return new Promise(function(resolve) {
              if (self.options.ignoreNiftiHeaders) {
                NIFTI(
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
                    NIFTI(
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
            // SECTION: PARTICIPANTS

            // check if participants file match found subjects
            if (participants) {
              const participantsFromFile = participants.list.sort()
              const participantsFromFolders = summary.subjects.sort()
              if (
                !utils.array.equals(
                  participantsFromFolders,
                  participantsFromFile,
                  true,
                )
              ) {
                self.issues.push(
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

            // check if dataset contains T1w
            if (summary.modalities.indexOf('T1w') < 0) {
              self.issues.push(
                new Issue({
                  code: 53,
                }),
              )
            }

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

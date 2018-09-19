const async = require('async')
const fs = require('fs')
const BIDS = require('./obj')
const utils = require('../../utils')
const Issue = utils.issues.Issue
const TSV = require('../tsv')
const json = require('../json')
const NIFTI = require('../nii')
const bval = require('../bval')
const bvec = require('../bvec')
const Events = require('../events')
const session = require('../session')
const checkAnyDataPresent = require('../checkAnyDataPresent')
const headerFields = require('../headerFields')
const subSesMismatchTest = require('./subSesMismatchTest')
/**
 * Full Test
 *
 * Takes on an array of files and starts
 * the validation process for a BIDS
 * package.
 */
const fullTest = (fileList, callback) => {
  let self = BIDS

  let jsonContentsDict = {},
    bContentsDict = {},
    events = [],
    stimuli = {
      events: [],
      directory: [],
    },
    niftis = [],
    jsonFiles = [],
    ephys = [],
    headers = [],
    participants = null,
    phenotypeParticipants = [],
    hasSubjectDir = false

  let tsvs = []
  let hasDatasetDescription = false

  let summary = {
    sessions: [],
    subjects: [],
    tasks: [],
    modalities: [],
    totalFiles: Object.keys(fileList).length,
    size: 0,
  }
  // collect file directory statistics
  async.eachOfLimit(fileList, 200, function(file) {
    // collect file stats
    if (typeof window !== 'undefined') {
      if (file.size) {
        summary.size += file.size
      }
    } else {
      if (!file.stats) {
        try {
          file.stats = fs.statSync(file.path)
        } catch (err) {
          file.stats = { size: 0 }
        }
      }
      summary.size += file.stats.size
    }
  })

  // remove ignored files from list:
  Object.keys(fileList).forEach(function(key) {
    if (fileList[key].ignore) {
      delete fileList[key]
    }
  })

  BIDS.issues = BIDS.issues.concat(subSesMismatchTest(fileList))

  // check for illegal character in task name and acq name

  const task_re = /sub-(.*?)_task-[a-zA-Z0-9]*[_-][a-zA-Z0-9]*(?:_acq-[a-zA-Z0-9-]*)?(?:_run-\d+)?_/g
  const acq_re = /sub-(.*?)(_task-\w+.\w+)?(_acq-[a-zA-Z0-9]*[_-][a-zA-Z0-9]*)(?:_run-\d+)?_/g

  const sub_re = /sub-[a-zA-Z0-9]*[_-][a-zA-Z0-9]*_/g // illegal character in sub
  const ses_re = /ses-[a-zA-Z0-9]*[_-][a-zA-Z0-9]*?_(.*?)/g //illegal character in ses

  const illegalchar_regex_list = [
    [task_re, 58, 'task name contains illegal character:'],
    [acq_re, 59, 'acq name contains illegal character:'],
    [sub_re, 62, 'sub name contains illegal character:'],
    [ses_re, 63, 'ses name contains illegal character:'],
  ]

  async.eachOfLimit(fileList, 200, function(file) {
    const completename = file.relativePath
    if (
      !(
        completename.startsWith('/derivatives') ||
        completename.startsWith('/code') ||
        completename.startsWith('/sourcedata')
      )
    ) {
      for (
        let re_index = 0;
        re_index < illegalchar_regex_list.length;
        re_index++
      ) {
        const err_regex = illegalchar_regex_list[re_index][0]
        const err_code = illegalchar_regex_list[re_index][1]
        const err_evidence = illegalchar_regex_list[re_index][2]

        if (err_regex.exec(completename)) {
          self.issues.push(
            new Issue({
              file: file,
              code: err_code,
              evidence: err_evidence + completename,
            }),
          )
        }
      }
    }
  })

  // validate individual files
  async.eachOfLimit(
    fileList,
    200,
    function(file, key, cb) {
      const path = file.relativePath
      const pathParts = path.split('_')
      const suffix = pathParts[pathParts.length - 1]

      // ignore associated data
      if (utils.type.file.isStimuliData(file.relativePath)) {
        stimuli.directory.push(file)
        process.nextTick(cb)
      }

      // validate path naming
      else if (
        !utils.type.isBIDS(
          file.relativePath,
          BIDS.options.bep006,
          BIDS.options.bep010,
        )
      ) {
        self.issues.push(
          new Issue({
            file: file,
            evidence: file.name,
            code: 1,
          }),
        )
        process.nextTick(cb)
      }
      // check modality by data file extension ...
      // and capture data files for later sanity checks (when available)
      else if (utils.type.file.isModality(file.name)) {
        // capture nifties for later validation
        if (file.name.endsWith('.nii') || file.name.endsWith('.nii.gz')) {
          niftis.push(file)
        }
        // collect modality summary
        const modality = suffix.slice(0, suffix.indexOf('.'))
        if (summary.modalities.indexOf(modality) === -1) {
          summary.modalities.push(modality)
        }

        process.nextTick(cb)
      }

      // capture ieeg files for summary
      else if (
        [
          'edf',
          'vhdr',
          'vmrk',
          'dat',
          'cnt',
          'bdf',
          'set',
          'nwb',
          'tdat',
          'tidx',
          'tmet',
        ].includes(file.name.split('.').pop())
      ) {
        ephys.push(file)

        process.nextTick(cb)
      }

      // validate tsv
      else if (file.name && file.name.endsWith('.tsv')) {
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
            TSV.TSV(file, contents, fileList, function(
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
              if (stimFiles.length) {
                // add unique new events to the stimuli.events array
                stimuli.events = [...new Set([...stimuli.events, ...stimFiles])]
              }
              self.issues = self.issues.concat(issues)
              process.nextTick(cb)
            })
          })
          .catch(issue => {
            self.issues.push(issue)
            process.nextTick(cb)
          })
      }

      // validate bvec
      else if (file.name && file.name.endsWith('.bvec')) {
        utils.files
          .readFile(file)
          .then(contents => {
            bContentsDict[file.relativePath] = contents
            bvec(file, contents, function(issues) {
              self.issues = self.issues.concat(issues)
              process.nextTick(cb)
            })
          })
          .catch(issue => {
            self.issues.push(issue)
            process.nextTick(cb)
          })
      }

      // validate bval
      else if (file.name && file.name.endsWith('.bval')) {
        utils.files
          .readFile(file)
          .then(contents => {
            bContentsDict[file.relativePath] = contents
            bval(file, contents, function(issues) {
              self.issues = self.issues.concat(issues)
              process.nextTick(cb)
            })
          })
          .catch(issue => {
            self.issues.push(issue)
            process.nextTick(cb)
          })
      }

      // load json data for validation later
      else if (file.name && file.name.endsWith('.json')) {
        // Verify that the json file has an accompanying data file
        // Need to limit checks to files in sub-*/**/ - Not all data dictionaries are sidecars
        const pathArgs = file.relativePath.split('/')
        const isSidecar =
          pathArgs[1].includes('sub-') && pathArgs.length > 3 ? true : false
        if (isSidecar) {
          // Check for suitable datafile accompanying this sidecar
          const dataFile = utils.bids_files.checkSidecarForDatafiles(
            file,
            fileList,
          )
          if (!dataFile) {
            self.issues.push(
              new Issue({
                code: 90,
                file: file,
              }),
            )
          }
        }
        utils.files
          .readFile(file)
          .then(contents => {
            utils.json.parse(file, contents, function(issues, jsObj) {
              self.issues = self.issues.concat(issues)

              // abort further tests if schema test does not pass
              if (issues.some(issue => issue.severity === 'error')) {
                process.nextTick(cb)
                return
              }

              jsonContentsDict[file.relativePath] = jsObj
              jsonFiles.push(file)
              process.nextTick(cb)
            })
          })
          .catch(issue => {
            self.issues.push(issue)
            process.nextTick(cb)
          })
      } else {
        process.nextTick(cb)
      }

      // check for subject directory presence
      if (path.startsWith('/sub-')) {
        hasSubjectDir = true
      }

      // check for dataset_description.json presence
      if (path === '/dataset_description.json') {
        hasDatasetDescription = true
      }

      // collect sessions & subjects
      if (
        !utils.type.file.isStimuliData(file.relativePath) &&
        utils.type.isBIDS(
          file.relativePath,
          BIDS.options.bep006,
          BIDS.options.bep010,
        )
      ) {
        const pathValues = utils.type.getPathValues(file.relativePath)
        const isEmptyRoom = pathValues.sub && pathValues.sub == 'emptyroom'

        if (
          pathValues.sub &&
          summary.subjects.indexOf(pathValues.sub) === -1 &&
          !isEmptyRoom
        ) {
          summary.subjects.push(pathValues.sub)
        }
        if (
          pathValues.ses &&
          summary.sessions.indexOf(pathValues.ses) === -1 &&
          !isEmptyRoom
        ) {
          summary.sessions.push(pathValues.ses)
        }
      }
    },
    function() {
      // check json data
      async.eachOfLimit(
        jsonFiles,
        200,
        function(file, key, cb) {
          json(file, jsonContentsDict, function(issues, jsObj) {
            self.issues = self.issues.concat(issues)
            // collect task summary
            if (file.name.indexOf('task') > -1) {
              const task = jsObj ? jsObj.TaskName : null
              if (task && summary.tasks.indexOf(task) === -1) {
                summary.tasks.push(task)
              }
            }
            process.nextTick(cb)
          })
        },
        function() {
          // check if same file with .nii and .nii.gz extensions is present
          const niftiCounts = niftis
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
              const duplicateFiles = niftis.filter(function(a) {
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
          const niftiNames = niftis.map(nifti => nifti.name)
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
                  file: niftis.find(niftiFile => niftiFile.name == nifti),
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
                  file: niftis.find(niftiFile => niftiFile.name == nifti),
                }),
              )
            }
          })

          async.eachOfLimit(
            niftis,
            200,
            function(file, key, cb) {
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
                    process.nextTick(cb)
                  },
                )
              } else {
                utils.files.readNiftiHeader(file, function(header) {
                  // check if header could be read
                  if (header && header.hasOwnProperty('error')) {
                    self.issues.push(header.error)
                    process.nextTick(cb)
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
                        process.nextTick(cb)
                      },
                    )
                  }
                })
              }
            },
            function() {
              if (!hasSubjectDir) {
                self.issues.push(new Issue({ code: 45 }))
              }
              if (!hasDatasetDescription) {
                self.issues.push(new Issue({ code: 57 }))
              }
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
              TSV.checkphenotype(phenotypeParticipants, summary, self.issues)

              // validate nii header fields
              self.issues = self.issues.concat(headerFields(headers))

              // Events validation
              Events.validateEvents(
                events,
                stimuli,
                headers,
                jsonContentsDict,
                self.issues,
              )

              // validate custom fields in all TSVs and add any issues to the list
              self.issues = self.issues.concat(
                TSV.validateTsvColumns(tsvs, jsonContentsDict),
              )

              // validation session files
              self.issues = self.issues.concat(session(fileList))

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
            },
          )
        },
      )
    },
  )
}

module.exports = fullTest

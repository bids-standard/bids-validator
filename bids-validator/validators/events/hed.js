import hedValidator from 'hed-validator'
import path from 'path'
import semver from 'semver'
import utils from '../../utils'
const Issue = utils.issues.Issue

export default function checkHedStrings(
  events,
  headers,
  jsonContents,
  jsonFiles,
  dir,
) {
  const hedDataExists = detectHed(events, jsonContents)
  if (!hedDataExists) {
    return Promise.resolve([])
  }
  const schemaDefinition = parseHedVersion(jsonContents, dir)
  return hedValidator.validator
    .buildSchema(schemaDefinition)
    .then(hedSchema => {
      return extractHed(
        events,
        jsonContents,
        jsonFiles,
        hedSchema,
        schemaDefinition,
      )
    })
}

function detectHed(events, jsonContents) {
  const checkedSidecars = []
  for (const eventFile of events) {
    const potentialSidecars = utils.files.potentialLocations(
      eventFile.path.replace('.tsv', '.json'),
    )
    for (const sidecarName of potentialSidecars) {
      if (!checkedSidecars.includes(sidecarName)) {
        checkedSidecars.push(sidecarName)
        const sidecarDictionary = jsonContents[sidecarName]
        for (const sidecarKey in sidecarDictionary) {
          const sidecarValue = sidecarDictionary[sidecarKey]
          if (sidecarValueHasHed(sidecarValue)) {
            return true
          }
        }
      }
    }
    const [columnHeaders] = splitTsv(eventFile)
    const hedColumnIndex = columnHeaders.indexOf('HED')
    if (hedColumnIndex !== -1) {
      return true
    }
  }
  return false
}

function parseHedVersion(jsonContents, dir) {
  const schemaDefinition = {}
  const datasetDescription = jsonContents['/dataset_description.json']

  if (datasetDescription && datasetDescription.HEDVersion) {
    if (semver.valid(datasetDescription.HEDVersion)) {
      schemaDefinition.version = datasetDescription.HEDVersion
    } else {
      schemaDefinition.path = path.join(
        path.resolve(dir),
        'sourcedata',
        datasetDescription.HEDVersion,
      )
    }
  }

  return schemaDefinition
}

function extractHed(
  events,
  jsonContents,
  jsonFiles,
  hedSchema,
  schemaDefinition,
) {
  let issues = []
  const sidecarIssueTypes = {}
  // loop through event data files
  events.forEach(eventFile => {
    let hedStrings = []
    // get the json sidecar dictionary associated with the event data
    const potentialSidecars = utils.files.potentialLocations(
      eventFile.path.replace('.tsv', '.json'),
    )
    const [sidecarErrorsFound, sidecarIssues] = validateSidecars(
      potentialSidecars,
      sidecarIssueTypes,
      jsonContents,
      hedSchema,
      jsonFiles,
    )
    if (sidecarErrorsFound) {
      issues = issues.concat(sidecarIssues)
      return
    }
    const sidecarHedTags = mergeSidecarHed(
      potentialSidecars,
      jsonContents,
      issues,
      eventFile,
    )

    const [tsvHedStrings, tsvIssues] = parseTsvHed(sidecarHedTags, eventFile)
    hedStrings = tsvHedStrings

    const datasetIssues = validateDataset(hedStrings, hedSchema, eventFile)
    issues = issues.concat(sidecarIssues, tsvIssues, datasetIssues)
  })
  if (Object.entries(schemaDefinition).length === 0) {
    issues.push(new Issue({ code: 132 }))
  }
  return issues
}

function validateSidecars(
  potentialSidecars,
  sidecarIssueTypes,
  jsonContents,
  hedSchema,
  jsonFiles,
) {
  let issues = []
  let sidecarErrorsFound = false
  // validate the HED strings in the json sidecars
  for (const sidecarName of potentialSidecars) {
    if (!(sidecarName in sidecarIssueTypes)) {
      const sidecarDictionary = jsonContents[sidecarName]
      let sidecarHedStrings = []
      for (const sidecarKey in sidecarDictionary) {
        const sidecarValue = sidecarDictionary[sidecarKey]
        if (sidecarValueHasHed(sidecarValue)) {
          if (typeof sidecarValue.HED === 'string') {
            sidecarHedStrings.push(sidecarValue.HED)
          } else {
            sidecarHedStrings = sidecarHedStrings.concat(
              Object.values(sidecarValue.HED),
            )
          }
        }
      }
      let fileIssues = []
      for (const hedString of sidecarHedStrings) {
        const [
          isHedStringValid,
          hedIssues,
        ] = hedValidator.validator.validateHedString(
          hedString,
          hedSchema,
          true,
          true,
        )
        if (!isHedStringValid) {
          const convertedIssues = convertHedIssuesToBidsIssues(
            hedIssues,
            getSidecarFileObject(sidecarName, jsonFiles),
          )
          fileIssues = fileIssues.concat(convertedIssues)
        }
      }
      if (fileIssues.length > 0) {
        let fileErrorsFound = false
        for (const fileIssue of fileIssues) {
          if (fileIssue.severity === 'error') {
            fileErrorsFound = true
            sidecarErrorsFound = true
            break
          }
        }
        if (fileErrorsFound) {
          issues.push(
            new Issue({
              code: 209,
              file: getSidecarFileObject(sidecarName, jsonFiles),
            }),
          )
          sidecarIssueTypes[sidecarName] = 'error'
        } else {
          issues.push(
            new Issue({
              code: 210,
              file: getSidecarFileObject(sidecarName, jsonFiles),
            }),
          )
          sidecarIssueTypes[sidecarName] = 'warning'
        }
        issues = issues.concat(fileIssues)
      }
    } else if (sidecarIssueTypes[sidecarName] === 'error') {
      sidecarErrorsFound = true
    }
  }
  return [sidecarErrorsFound, issues]
}

function getSidecarFileObject(sidecarName, jsonFiles) {
  return jsonFiles.filter(file => {
    return file.relativePath === sidecarName
  })[0]
}

function mergeSidecarHed(potentialSidecars, jsonContents, issues, eventFile) {
  const mergedDictionary = utils.files.generateMergedSidecarDict(
    potentialSidecars,
    jsonContents,
  )

  const sidecarHedTags = {}
  for (const sidecarKey in mergedDictionary) {
    const sidecarValue = mergedDictionary[sidecarKey]
    if (sidecarValueHasHed(sidecarValue)) {
      const sidecarHedData = sidecarValue.HED
      if (
        typeof sidecarHedData === 'string' &&
        sidecarHedData.split('#').length !== 2
      ) {
        issues.push(
          new Issue({
            code: 203,
            file: eventFile.file,
            evidence: sidecarHedData,
          }),
        )
        sidecarHedTags[sidecarKey] = false
      } else {
        sidecarHedTags[sidecarKey] = sidecarHedData
      }
    }
  }
  return sidecarHedTags
}

function sidecarValueHasHed(sidecarValue) {
  return (
    sidecarValue !== null &&
    typeof sidecarValue === 'object' &&
    sidecarValue.HED !== undefined
  )
}

function parseTsvHed(sidecarHedTags, eventFile) {
  const hedStrings = []
  const issues = []
  const [columnHeaders, dataRows] = splitTsv(eventFile)
  const hedColumnIndex = columnHeaders.indexOf('HED')
  const sidecarHedColumnIndices = {}
  for (const sidecarHedColumn in sidecarHedTags) {
    const sidecarHedColumnHeader = columnHeaders.indexOf(sidecarHedColumn)
    if (sidecarHedColumnHeader > -1) {
      sidecarHedColumnIndices[sidecarHedColumn] = sidecarHedColumnHeader
    }
  }
  if (hedColumnIndex === -1 && sidecarHedColumnIndices.length === 0) {
    return
  }

  for (const row of dataRows) {
    // get the 'HED' field
    const rowCells = row.trim().split('\t')
    const hedStringParts = []
    if (rowCells[hedColumnIndex] && rowCells[hedColumnIndex] !== 'n/a') {
      hedStringParts.push(rowCells[hedColumnIndex])
    }
    for (const sidecarHedColumn in sidecarHedColumnIndices) {
      const sidecarHedIndex = sidecarHedColumnIndices[sidecarHedColumn]
      const sidecarHedData = sidecarHedTags[sidecarHedColumn]
      const rowCell = rowCells[sidecarHedIndex]
      if (rowCell && rowCell !== 'n/a') {
        let sidecarHedString
        if (!sidecarHedData) {
          continue
        }
        if (typeof sidecarHedData === 'string') {
          sidecarHedString = sidecarHedData.replace('#', rowCell)
        } else {
          sidecarHedString = sidecarHedData[rowCell]
        }
        if (sidecarHedString !== undefined) {
          hedStringParts.push(sidecarHedString)
        } else {
          issues.push(
            new Issue({
              code: 112,
              file: eventFile.file,
              evidence: rowCell,
            }),
          )
        }
      }
    }

    if (hedStringParts.length === 0) {
      continue
    }
    hedStrings.push(hedStringParts.join(','))
  }
  return [hedStrings, issues]
}

function splitTsv(eventFile) {
  const rows = eventFile.contents
    .split('\n')
    .filter(row => !(!row || /^\s*$/.test(row)))

  const columnHeaders = rows[0].trim().split('\t')
  const dataRows = rows.slice(1)
  return [columnHeaders, dataRows]
}

function validateDataset(hedStrings, hedSchema, eventFile) {
  const [
    isHedDatasetValid,
    hedIssues,
  ] = hedValidator.validator.validateHedDataset(hedStrings, hedSchema, true)
  if (!isHedDatasetValid) {
    const convertedIssues = convertHedIssuesToBidsIssues(
      hedIssues,
      eventFile.file,
    )
    return convertedIssues
  } else {
    return []
  }
}

function convertHedIssuesToBidsIssues(hedIssues, file) {
  const hedIssuesToBidsCodes = {
    invalidCharacter: 106,
    parentheses: 107,
    commaMissing: 108,
    capitalization: 109,
    duplicateTag: 110,
    tooManyTildes: 111,
    extraDelimiter: 115,
    invalidTag: 116,
    multipleUniqueTags: 117,
    childRequired: 118,
    requiredPrefixMissing: 119,
    unitClassDefaultUsed: 120,
    unitClassInvalidUnit: 121,
    extraCommaOrInvalid: 122,
    invalidParentNode: 204,
    noValidTagFound: 205,
    emptyTagFound: 206,
    duplicateTagsInSchema: 207,
    extension: 208,
  }

  const convertedIssues = []
  for (const hedIssue of hedIssues) {
    const bidsIssueCode = hedIssuesToBidsCodes[hedIssue.code]
    if (bidsIssueCode === undefined) {
      if (hedIssue.message.startsWith('WARNING')) {
        convertedIssues.push(
          new Issue({
            code: 105,
            file: file,
            evidence: hedIssue.message,
          }),
        )
      } else {
        convertedIssues.push(
          new Issue({
            code: 104,
            file: file,
            evidence: hedIssue.message,
          }),
        )
      }
    } else {
      convertedIssues.push(
        new Issue({
          code: bidsIssueCode,
          file: file,
          evidence: hedIssue.message,
        }),
      )
    }
  }

  return convertedIssues
}

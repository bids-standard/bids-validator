import hedValidator from 'hed-validator'
import path from 'path'
import semver from 'semver'
import utils from '../../utils'
import parseTsv from '../tsv/tsvParser'
import union from 'lodash/union'

const Issue = utils.issues.Issue

export default function checkHedStrings(events, jsonContents, jsonFiles, dir) {
  const eventData = constructEventData(events, jsonContents)
  const sidecarData = constructSidecarData(events, jsonContents, jsonFiles)
  const hedDataExists = detectHed(eventData, sidecarData)
  if (!hedDataExists) {
    return Promise.resolve([])
  }
  const [schemaDefinition, schemaDefinitionIssues] = parseHedVersion(
    jsonContents,
    dir,
  )
  try {
    return hedValidator.validator
      .validateBidsDataset(eventData, sidecarData, schemaDefinition)
      .then(hedValidationIssues => {
        return [].concat(
          schemaDefinitionIssues,
          convertHedIssuesToBidsIssues(hedValidationIssues),
        )
      })
  } catch (error) {
    const issues = [internalHedValidatorIssue(error)].concat(
      schemaDefinitionIssues,
    )
    return Promise.resolve(issues)
  }
}

function constructEventData(events, jsonContents) {
  return events.map(eventFile => {
    const potentialSidecars = utils.files.potentialLocations(
      eventFile.path.replace('.tsv', '.json'),
    )
    const mergedDictionary = utils.files.generateMergedSidecarDict(
      potentialSidecars,
      jsonContents,
    )
    const parsedTsv = parseTsv(eventFile.contents)
    const file = eventFile.file
    return new hedValidator.validator.BidsEventFile(
      potentialSidecars,
      mergedDictionary,
      parsedTsv,
      file,
    )
  })
}

function constructSidecarData(eventData, jsonContents, jsonFiles) {
  const actualSidecarNames = Object.keys(jsonContents)
  let potentialEventSidecars = []
  for (const eventFileData of eventData) {
    potentialEventSidecars = potentialEventSidecars.concat(
      eventFileData.potentialSidecars,
    )
  }
  const actualEventSidecars = union(actualSidecarNames, potentialEventSidecars)
  return new Map(
    actualEventSidecars.map(sidecarName => {
      return [
        sidecarName,
        new hedValidator.validator.BidsSidecar(
          jsonContents[sidecarName],
          getSidecarFileObject(sidecarName, jsonFiles),
        ),
      ]
    }),
  )
}

function getSidecarFileObject(sidecarName, jsonFiles) {
  return jsonFiles.filter(file => {
    return file.relativePath === sidecarName
  })[0]
}

function detectHed(eventData, sidecarData) {
  return (
    Array.from(sidecarData.values()).some(sidecarFileData => {
      return Object.values(sidecarFileData.sidecarData).some(sidecarValueHasHed)
    }) ||
    eventData.some(eventFileData => {
      return eventFileData.parsedTsv.headers.indexOf('HED') !== -1
    })
  )
}

function sidecarValueHasHed(sidecarValue) {
  return (
    sidecarValue !== null &&
    typeof sidecarValue === 'object' &&
    sidecarValue.HED !== undefined
  )
}

function parseHedVersion(jsonContents, dir) {
  const schemaDefinition = {}
  const datasetDescription = jsonContents['/dataset_description.json']
  const issues = []

  if (!(datasetDescription && datasetDescription.HEDVersion)) {
    issues.push(new Issue({ code: 109 }))
  } else if (semver.valid(datasetDescription.HEDVersion)) {
    schemaDefinition.version = datasetDescription.HEDVersion
  } else {
    schemaDefinition.path = path.join(
      path.resolve(dir),
      'sourcedata',
      datasetDescription.HEDVersion,
    )
  }

  return [schemaDefinition, issues]
}

function internalHedValidatorIssue(error) {
  return Issue.errorToIssue(error, 107)
}

function convertHedIssuesToBidsIssues(hedIssues) {
  return hedIssues.map(hedIssue => {
    return new Issue(hedIssue)
  })
}

import hedValidator from 'hed-validator'
import utils from '../utils'

const Issue = utils.issues.Issue

export default async function returnHedIssues(tsvs, jsonContents, jsonFiles) {
  const issues = await checkHedStrings(tsvs, jsonContents, jsonFiles)
  return issues.map((issue) => new Issue(issue))
}

async function checkHedStrings(tsvs, jsonContents, jsonFiles) {
  const datasetDescription = jsonContents['/dataset_description.json']
  const datasetDescriptionData = new hedValidator.bids.BidsJsonFile(
    '/dataset_description.json',
    datasetDescription,
    getSidecarFileObject('/dataset_description.json', jsonFiles),
  )

  let hedSchemas
  try {
    hedSchemas = await hedValidator.bids.buildBidsSchemas(
      datasetDescriptionData,
      null,
    )
  } catch (issueError) {
    return hedValidator.bids.BidsHedIssue.fromHedIssues(
      issueError,
      datasetDescriptionData.file,
    )
  }

  const sidecarIssues = validateFiles(
    buildSidecars(jsonContents, jsonFiles),
    hedSchemas,
  )

  if (sidecarIssues.some((issue) => issue.isError() || issue.code === 109)) {
    return sidecarIssues
  }

  const tsvIssues = validateFiles(buildTsvs(tsvs, jsonContents), hedSchemas)

  return [...sidecarIssues, ...tsvIssues]
}

function* buildSidecars(jsonContents, jsonFiles) {
  for (const [sidecarName, sidecarContents] of Object.entries(jsonContents)) {
    yield buildSidecar(sidecarName, sidecarContents, jsonFiles)
  }
}

function buildSidecar(sidecarName, sidecarContents, jsonFiles) {
  const file = getSidecarFileObject(sidecarName, jsonFiles)

  return new hedValidator.bids.BidsSidecar(sidecarName, sidecarContents, file)
}

function* buildTsvs(tsvs, jsonContents) {
  for (const tsv of tsvs) {
    yield buildTsv(tsv, jsonContents)
  }
}

function buildTsv(tsv, jsonContents) {
  const potentialSidecars = utils.files.potentialLocations(
    tsv.file.relativePath.replace('.tsv', '.json'),
  )
  const mergedDictionary = utils.files.generateMergedSidecarDict(
    potentialSidecars,
    jsonContents,
  )

  return new hedValidator.bids.BidsTsvFile(
    tsv.file.relativePath,
    tsv.contents,
    tsv.file,
    potentialSidecars,
    mergedDictionary,
  )
}

function validateFiles(fileGenerator, hedSchemas) {
  const issues = []
  for (const file of fileGenerator) {
    try {
      const fileIssues = file.validate(hedSchemas)
      if (fileIssues === null) {
        return [new hedValidator.bids.BidsIssue(109)]
      }
      issues.push(fileIssues)
    } catch (issueError) {
      return hedValidator.bids.BidsHedIssue.fromHedIssues(issueError, file.file)
    }
  }
  return issues.flat()
}

function getSidecarFileObject(sidecarName, jsonFiles) {
  return jsonFiles.filter((file) => {
    return file.relativePath === sidecarName
  })[0]
}

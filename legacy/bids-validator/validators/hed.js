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

  const issues = []
  for (const [sidecarName, sidecarContents] of Object.entries(jsonContents)) {
    try {
      const sidecarFile = buildSidecar(sidecarName, sidecarContents, jsonFiles)
      issues.push(...validateFile(sidecarFile, hedSchemas))
    } catch (e) {
      issues.push(new Issue({ code: 109 }))
      return issues
    }
  }

  if (issues.some((issue) => issue.isError())) {
    return issues
  }

  for (const tsv of tsvs) {
    try {
      const tsvFile = buildTsv(tsv, jsonContents)
      issues.push(...validateFile(tsvFile, hedSchemas))
    } catch (e) {
      issues.push(new Issue({ code: 109 }))
      return issues
    }
  }

  return issues
}

function buildSidecar(sidecarName, sidecarContents, jsonFiles) {
  const file = getSidecarFileObject(sidecarName, jsonFiles)

  return new hedValidator.bids.BidsSidecar(sidecarName, sidecarContents, file)
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

function validateFile(file, hedSchemas) {
  const issues = file.validate(hedSchemas)
  if (issues === null) {
    throw new Error()
  }
  return issues
}

function getSidecarFileObject(sidecarName, jsonFiles) {
  return jsonFiles.filter((file) => {
    return file.relativePath === sidecarName
  })[0]
}

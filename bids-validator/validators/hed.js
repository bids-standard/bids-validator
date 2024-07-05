import hedValidator from 'hed-validator'
import utils from '../utils'

const Issue = utils.issues.Issue

export default async function checkHedStrings(tsvs, jsonContents, jsonFiles) {
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

  const [sidecarsByTsv, allSidecars] = generateSidecarNames(tsvs)

  const issues = []
  for (const sidecarName of allSidecars) {
    try {
      issues.push(
        ...validateSidecar(sidecarName, hedSchemas, jsonContents, jsonFiles),
      )
    } catch (e) {
      issues.push(new Issue({ code: 109 }))
      return issues
    }
  }

  if (issues.some((issue) => issue.isError())) {
    return issues
  }

  for (const tsvFile of tsvs) {
    const tsvSidecars = sidecarsByTsv.get(tsvFile)
    try {
      issues.push(
        ...validateTsv(tsvFile, tsvSidecars, hedSchemas, jsonContents),
      )
    } catch (e) {
      issues.push(new Issue({ code: 109 }))
      return issues
    }
  }

  return issues
}

function generateSidecarNames(tsvFiles) {
  const sidecarNamesByTsv = new Map()
  const allSidecarNames = new Set()
  for (const tsvFile of tsvFiles) {
    const potentialSidecars = utils.files.potentialLocations(
      tsvFile.file.relativePath.replace('.tsv', '.json'),
    )
    sidecarNamesByTsv.set(tsvFile, potentialSidecars)
    for (const sidecar of potentialSidecars) {
      allSidecarNames.add(sidecar)
    }
  }
  return [sidecarNamesByTsv, allSidecarNames]
}

function validateSidecar(sidecarName, hedSchemas, jsonContents, jsonFiles) {
  const contents = jsonContents[sidecarName]
  const file = getSidecarFileObject(sidecarName, jsonFiles)

  const sidecarFile = new hedValidator.bids.BidsSidecar(
    sidecarName,
    contents,
    file,
  )

  if (!sidecarFile.hasHedData()) {
    return []
  } else if (hedSchemas === null) {
    throw new Error()
  }

  try {
    const sidecarValidator = new hedValidator.bids.BidsHedSidecarValidator(
      sidecarFile,
      hedSchemas,
    )
    return sidecarValidator.validate()
  } catch (internalError) {
    return [
      new Issue({ code: 106, file: file, evidence: internalError.message }),
    ]
  }
}

function validateTsv(tsv, tsvSidecarNames, hedSchemas, jsonContents) {
  const mergedDictionary = utils.files.generateMergedSidecarDict(
    tsvSidecarNames,
    jsonContents,
  )

  const tsvFile = new hedValidator.bids.BidsTsvFile(
    tsv.path,
    tsv.contents,
    tsv.file,
    tsvSidecarNames,
    mergedDictionary,
  )

  if (!tsvFile.hasHedData()) {
    return []
  } else if (hedSchemas === null) {
    throw new Error()
  }

  try {
    const tsvValidator = new hedValidator.bids.BidsHedTsvValidator(
      tsvFile,
      hedSchemas,
    )
    return tsvValidator.validate()
  } catch (internalError) {
    return [
      new Issue({ code: 106, file: tsv.file, evidence: internalError.message }),
    ]
  }
}

function getSidecarFileObject(sidecarName, jsonFiles) {
  return jsonFiles.filter((file) => {
    return file.relativePath === sidecarName
  })[0]
}

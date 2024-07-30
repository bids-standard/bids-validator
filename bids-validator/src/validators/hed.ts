import hedValidator from '../deps/hed-validator.ts'
import { hedOldToNewLookup } from '../issues/list.ts'
import { GenericSchema } from '../types/schema.ts'
import { IssueFile, IssueFileOutput } from '../types/issues.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { ColumnsMap } from '../types/columns.ts'

/*
export class BidsJson extends hedValidator.bids.BidsJsonFile {}
export class BidsSidecar extends hedValidator.bids.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {}
*/

// https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
function transpose(matrix: string[][]) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]))
}

function columnsToContent(columns: ColumnsMap) {
  const cols = [] as [][]
  for (let header in columns) {
    // @ts-expect-error
    cols.push(columns[header])
  }
  const rows = transpose(cols)
  return {
    headers: Object.keys(columns),
    rows,
  }
}


function sidecarHasHed(sidecarData: BIDSContext["sidecar"]) {
  if (!sidecarData) {
    return false
  }
  return Object.keys(sidecarData).some(x => sidecarValueHasHed(sidecarData[x]))
}

function sidecarValueHasHed(sidecarValue: unknown) {
  return (
    sidecarValue !== null &&
    typeof sidecarValue === 'object' &&
    'HED' in sidecarValue &&
    sidecarValue.HED !== undefined
  )
}

let hedSchemas: object | undefined | null = undefined

async function setHedSchemas(datasetDescriptionJson = {}) {
  const datasetDescriptionData = new hedValidator.bids.BidsJsonFile(
    '/dataset_description.json',
    datasetDescriptionJson,
    null,
  )
  try {
    hedSchemas = await hedValidator.bids.buildBidsSchemas(
      datasetDescriptionData,
      null,
    )
    return [] as HedIssue[]
  } catch (issueError) {
    hedSchemas = null
    return hedValidator.bids.BidsHedIssue.fromHedIssues(
      issueError,
      datasetDescriptionData.file,
    )
  }
}

export interface HedIssue {
  code: number
  file: IssueFile
  evidence: string
}

export async function hedValidate(
  schema: GenericSchema,
  context: BIDSContext,
): Promise<void> {
  let file
  let hedValidationIssues = [] as HedIssue[]

  try {
    if (context.extension == '.tsv' && context.columns) {
      if (!('HED' in context.columns) && !sidecarHasHed(context.sidecar)) {
        return
      }
      hedValidationIssues = await setHedSchemas(context.dataset.dataset_description)

      file = buildHedTsvFile(schema, context)
    } else if (context.extension == '.json' && sidecarHasHed(context.json)) {
      hedValidationIssues = hedValidationIssues = await setHedSchemas(context.dataset.dataset_description)
      file = buildHedSidecarFile(schema, context)
    }

    if (file !== undefined) {
      hedValidationIssues.push(...file.validate(hedSchemas))
    }
  } catch (error) {
    context.issues.addNonSchemaIssue('HED_ERROR', [context.file])
  }

  hedValidationIssues.map((hedIssue) => {
    const code = hedIssue.code
    if (code in hedOldToNewLookup) {
      context.issues.addNonSchemaIssue(
        hedOldToNewLookup[code],
        [{ ...hedIssue.file, evidence: hedIssue.evidence }],
      )
    }
  })
}

function buildHedTsvFile(
  schema: GenericSchema,
  context: BIDSContext,
)  {
  const tsvContent = columnsToContent(context.columns)
  const eventFile = new hedValidator.bids.BidsTsvFile(
    context.path,
    tsvContent,
    context.file,
    [],
    context.sidecar,
  )
  return eventFile
}

function buildHedSidecarFile(
  schema: GenericSchema,
  context: BIDSContext,
) {
  const sidecarFile = new hedValidator.bids.BidsSidecar(
    context.path,
    context.json,
    context.file,
  )
  return sidecarFile
}

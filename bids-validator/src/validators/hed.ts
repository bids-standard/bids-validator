import hedValidator from '../deps/hed-validator.ts'
import { hedOldToNewLookup } from '../issues/list.ts'
import { logger } from '../utils/logger.ts'
import { GenericSchema } from '../types/schema.ts'
import { IssueFile } from '../types/issues.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { ColumnsMap } from '../types/columns.ts'
class BidsSidecar extends hedValidator.validator.BidsSidecar {}
class BidsEventFile extends hedValidator.bids.BidsEventFile {} 

/* This should be moved into the dataset context.  Will not properly work
 * with derivatives since it persists between validations.
 */
const hedArgs = {
  eventData: [] as BidsEventFile[],
  sidecarData: [] as BidsSidecar[],
  datasetDescription: '',
  dir: '',
}

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

function detectHed(tsvData: BidsEventFile[], sidecarData: BidsSidecar[]) {
  return (
    sidecarData.some((sidecarFileData) => {
      return Object.values(sidecarFileData.sidecarData).some(sidecarValueHasHed)
    }) ||
    tsvData.some((tsvFileData) => {
      return tsvFileData.parsedTsv.headers.indexOf('HED') !== -1
    })
  )
} 

export function testDetectHed() {
  return detectHed(hedArgs.eventData, hedArgs.sidecarData)
}
  
function sidecarValueHasHed(sidecarValue: unknown) {
  return ( 
    sidecarValue !== null &&
    typeof sidecarValue === 'object' &&
    'HED' in sidecarValue &&
    sidecarValue.HED !== undefined
  )
}

export async function hedAccumulator(schema: GenericSchema, context: BIDSContext) {
  if (context.file.name == 'dataset_description.json') {
    hedArgs.datasetDescription = String(new hedValidator.validator.BidsJsonFile(
      '/dataset_description.json',
      await context.json,
      context.file,
    ))
    hedArgs.dir = context.datasetPath
  }
  if (context.suffix == 'events' && context.extension == '.tsv') {
    const tsvContent = columnsToContent(context.columns)

    const eventFile = new BidsEventFile(
      context.path,
      [],
      context.sidecar,
      tsvContent,
      context.file,
    )
    hedArgs.eventData.push(eventFile)
  }

  if (context.extension == '.json') {
    const sidecarFile = new BidsSidecar(context.path, await context.json, context.file)
    hedArgs.sidecarData.push(
      sidecarFile
    )
  }
}

export interface HedIssue {
  code: number
  file: IssueFile
  evidence: string
}

export async function hedValidate(schema: GenericSchema, dsContext: BIDSContextDataset, issues: DatasetIssues): Promise<void>{
  if (!detectHed(hedArgs.eventData, hedArgs.sidecarData)) {
    return Promise.resolve()
  }
  let hedDs = new hedValidator.validator.BidsDataset(...Object.values(hedArgs))
  await hedValidator.validator
    .validateBidsDataset(hedDs)
    .then((hedValidationIssues: HedIssue[]) => {
      logger.debug("Issues from hed validator:")
      logger.debug(hedValidationIssues)
      const newStyle = hedValidationIssues.map((hedIssue) => {
        const code = hedIssue.code
        if (code in hedOldToNewLookup) {
          issues.addNonSchemaIssue(
            hedOldToNewLookup[code], [{...hedIssue.file, evidence: hedIssue.evidence}]
          )
        }
      })
    })
  return Promise.resolve()
}


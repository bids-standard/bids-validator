import hedValidator from '../deps/hed-validator.ts'
import { hedOldToNewLookup } from '../issues/list.ts'
import { GenericSchema } from '../types/schema.ts'
import { IssueFile } from '../types/issues.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { ColumnsMap } from '../types/columns.ts'

export class BidsSidecar extends hedValidator.validator.BidsSidecar {}
export class BidsEventFile extends hedValidator.bids.BidsEventFile {} 

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
      return 'HED' in tsvFileData.parsedTsv
    })
  )
} 

export function testDetectHed(dsContext: BIDSContextDataset) {
  return detectHed(dsContext.hedArgs.eventData, dsContext.hedArgs.sidecarData)
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
    context.dataset.hedArgs.datasetDescription = new hedValidator.validator.BidsJsonFile(
      '/dataset_description.json',
      await context.json,
      context.file,
    )
    context.dataset.hedArgs.dir = context.datasetPath
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
    context.dataset.hedArgs.eventData.push(eventFile)
  }

  if (context.extension == '.json') {
    const sidecarFile = new BidsSidecar(context.path, await context.json, context.file)
    context.dataset.hedArgs.sidecarData.push(
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
  if (!detectHed(dsContext.hedArgs.eventData, dsContext.hedArgs.sidecarData)) {
    return Promise.resolve()
  }
  let hedDs = new hedValidator.validator.BidsDataset(...Object.values(dsContext.hedArgs))
  await hedValidator.validator
    .validateBidsDataset(hedDs)
    .then((hedValidationIssues: HedIssue[]) => {
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


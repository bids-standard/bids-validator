import hedValidator from '../deps/hed-validator.ts'
import { hedOldToNewLookup } from '../issues/list.ts'
import { GenericSchema } from '../types/schema.ts'
import { IssueFile, IssueFileOutput } from '../types/issues.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { ColumnsMap } from '../types/columns.ts'

function sidecarHasHed(sidecarData: BIDSContext['sidecar']) {
  if (!sidecarData) {
    return false
  }
  return Object.keys(sidecarData).some((x) => sidecarValueHasHed(sidecarData[x]))
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

      file = await buildHedTsvFile(context)
    } else if (context.extension == '.json' && sidecarHasHed(context.json)) {
      hedValidationIssues = hedValidationIssues = await setHedSchemas(
        context.dataset.dataset_description,
      )
      file = buildHedSidecarFile(context)
    }

    if (file !== undefined) {
      hedValidationIssues.push(...file.validate(hedSchemas))
    }
  } catch (error) {
    context.dataset.issues.addNonSchemaIssue('HED_ERROR', [{ ...context.file, evidence: error }])
  }

  hedValidationIssues.map((hedIssue) => {
    const code = hedIssue.code
    if (code in hedOldToNewLookup) {
      context.dataset.issues.addNonSchemaIssue(
        hedOldToNewLookup[code],
        [{ ...hedIssue.file, evidence: hedIssue.evidence }],
      )
    }
  })
}

function buildHedTsvFile(context: BIDSContext) {
  const eventFile = new hedValidator.bids.BidsTsvFile(
    context.path,
    context.columns,
    context.file,
    [],
    context.sidecar,
  )
  return eventFile
}

function buildHedSidecarFile(context: BIDSContext) {
  const sidecarFile = new hedValidator.bids.BidsSidecar(
    context.path,
    context.json,
    context.file,
  )
  return sidecarFile
}

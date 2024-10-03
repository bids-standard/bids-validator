import hedValidator from '@hed/validator'
import { hedOldToNewLookup } from '../issues/list.ts'
import type { GenericSchema } from '../types/schema.ts'
import type { IssueFile } from '../types/issues.ts'
import type { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import type { ColumnsMap } from '../types/columns.ts'

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

    if (file) {
      hedValidationIssues.push(...file.validate(hedSchemas))
    }
  } catch (error) {
    context.dataset.issues.add({
      code: 'HED_ERROR',
      location: context.path,
      issueMessage: error,
    })
  }

  hedValidationIssues.map((hedIssue) => {
    const code = hedIssue.code
    if (code in hedOldToNewLookup) {
      const location = hedIssue.file ? hedIssue.file.path : ''
      context.dataset.issues.add({
        code: hedOldToNewLookup[code],
        // @ts-expect-error
        subCode: hedIssue.hedIssue.hedCode, // Hidden property
        location,
        issueMessage: hedIssue.evidence,
      })
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

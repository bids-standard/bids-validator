import hedValidator from '@hed/validator'
import { hedOldToNewLookup } from '../issues/list.ts'
import type { GenericSchema } from '../types/schema.ts'
import type { IssueFile } from '../types/issues.ts'
import type { BIDSContext, BIDSContextDataset } from '../schema/context.ts'

export interface HedIssue {
  code: number
  file: IssueFile
  evidence: string
}

function sidecarHasHed(sidecarData: BIDSContext['sidecar']): boolean {
  if (!sidecarData) {
    return false
  }
  return Object.keys(sidecarData).some((x) => sidecarValueHasHed(sidecarData[x]))
}

function sidecarValueHasHed(sidecarValue: { HED?: string }): boolean {
  return typeof sidecarValue.HED !== 'undefined'
}

async function setHedSchemas(dataset: BIDSContextDataset): Promise<HedIssue[]> {
  if (dataset.hedSchemas !== undefined) {
    return [] as HedIssue[]
  }
  const datasetDescriptionData = new hedValidator.bids.BidsJsonFile(
    '/dataset_description.json',
    dataset.dataset_description,
    null,
  )
  try {
    dataset.hedSchemas = await hedValidator.bids.buildBidsSchemas(
      datasetDescriptionData,
      null,
    )
    return [] as HedIssue[]
  } catch (issueError) {
    dataset.hedSchemas = null
    return hedValidator.bids.BidsHedIssue.fromHedIssues(
      issueError,
      datasetDescriptionData.file,
    )
  }
}

export async function hedValidate(
  _schema: GenericSchema,
  context: BIDSContext,
): Promise<void> {
  let file
  let hedValidationIssues = [] as HedIssue[]

  if (context.dataset.hedSchemas === null) {
    return
  }

  try {
    if (context.extension === '.tsv' && context.columns) {
      if (!('HED' in context.columns) && !sidecarHasHed(context.sidecar)) {
        return
      }
      hedValidationIssues = await setHedSchemas(context.dataset)
      file = buildHedTsvFile(context)
    } else if (context.extension === '.json' && sidecarHasHed(context.json)) {
      hedValidationIssues = await setHedSchemas(context.dataset)
      file = buildHedSidecarFile(context)
    }

    if (file) {
      const fileIssues = file.validate(context.dataset.hedSchemas) ?? [] as HedIssue[]
      hedValidationIssues.push(...fileIssues)
    }
  } catch (error) {
    context.dataset.issues.add({
      code: 'HED_INTERNAL_ERROR',
      location: context.path,
      issueMessage: error as string,
    })
  }

  for (const hedIssue of hedValidationIssues) {
    const code = hedIssue.code
    if (code in hedOldToNewLookup) {
      const location = hedIssue.file?.path ?? ''
      context.dataset.issues.add({
        code: hedOldToNewLookup[code],
        // @ts-expect-error  Hidden property
        subCode: hedIssue.hedIssue?.hedCode,
        location,
        issueMessage: hedIssue.evidence,
      })
    }
  }
}

function buildHedTsvFile(context: BIDSContext): hedValidator.bids.BidsTsvFile {
  return new hedValidator.bids.BidsTsvFile(
    context.path,
    context.columns,
    context.file,
    [],
    context.sidecar,
  )
}

function buildHedSidecarFile(context: BIDSContext): hedValidator.bids.BidsSidecar {
  return new hedValidator.bids.BidsSidecar(
    context.path,
    context.json,
    context.file,
  )
}

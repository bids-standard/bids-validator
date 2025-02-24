import * as hedValidator from '@hed/validator'
import type { GenericSchema } from '../types/schema.ts'
import type { Issue } from '../types/issues.ts'
import type { BIDSContext, BIDSContextDataset } from '../schema/context.ts'

export interface HedIssue extends Issue {}

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
  const datasetDescriptionData = new hedValidator.BidsJsonFile(
    '/dataset_description.json',
    null,
    dataset.dataset_description,
  )
  try {
    dataset.hedSchemas = await hedValidator.buildBidsSchemas(
      datasetDescriptionData,
    )
    return [] as HedIssue[]
  } catch (issueError) {
    dataset.hedSchemas = null
    return hedValidator.BidsHedIssue.fromHedIssues(
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
      code: 'HED_ERROR',
      subCode: 'INTERNAL_ERROR',
      location: context.path,
      issueMessage: error as string,
    })
  }

  for (const hedIssue of hedValidationIssues) {
    context.dataset.issues.add(hedIssue)
  }
}

function buildHedTsvFile(context: BIDSContext): hedValidator.BidsTsvFile {
  return new hedValidator.BidsTsvFile(
    context.path,
    context.file,
    context.columns,
    context.sidecar,
  )
}

function buildHedSidecarFile(context: BIDSContext): hedValidator.BidsSidecar {
  return new hedValidator.BidsSidecar(
    context.path,
    context.file,
    context.json,
  )
}

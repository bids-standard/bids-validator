import type * as HedValidator from '@hed/validator'
import type { GenericSchema } from '../types/schema.ts'
import type { Issue } from '../types/issues.ts'
import type { BIDSContext, BIDSContextDataset } from '../schema/context.ts'

export interface HedIssue extends Issue {}

function sidecarHasHed(sidecarData: BIDSContext['sidecar']): boolean {
  if (!sidecarData) {
    return false
  }
  return Object.keys(sidecarData).some((x) =>
    sidecarValueHasHed(sidecarData[x] as { HED?: string })
  )
}

function sidecarValueHasHed(sidecarValue: { HED?: string }): boolean {
  return typeof sidecarValue?.HED !== 'undefined'
}

async function setHedSchemas(
  dataset: BIDSContextDataset,
  hedValidator: typeof HedValidator,
): Promise<HedIssue[]> {
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
  } catch (error) {
    dataset.hedSchemas = null
    let issueError: Error
    if (error instanceof Error) {
      issueError = error
    } else {
      issueError = new Error('unknown error')
    }
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
  if (context.dataset.hedSchemas === null) {
    return
  }
  // This logic was previously lower down, now we check it first to save 8MB
  let isHedFile = false
  if (
    context.extension === '.tsv' && context.columns &&
    ('HED' in context.columns || sidecarHasHed(context.sidecar))
  ) {
    isHedFile = true
  } else if (context.extension === '.json' && sidecarHasHed(context.json)) {
    isHedFile = true
  }

  // If it's not a HED file, return early without loading the library!
  if (!isHedFile) {
    return
  }

  try {
    const hedValidator = await import('@hed/validator')

    let file
    if (context.extension === '.tsv') {
      file = buildHedTsvFile(context, hedValidator)
    } else {
      file = buildHedSidecarFile(context, hedValidator)
    }

    const hedValidationIssues = await setHedSchemas(context.dataset, hedValidator)

    if (hedValidationIssues.length === 0) {
      const fileIssues = file.validate(context.dataset.hedSchemas) ?? [] as HedIssue[]
      hedValidationIssues.push(...fileIssues)
    }

    for (const hedIssue of hedValidationIssues) {
      context.dataset.issues.add(hedIssue)
    }
  } catch (error) {
    context.dataset.issues.add({
      code: 'HED_ERROR',
      subCode: 'INTERNAL_ERROR',
      location: context.path,
      issueMessage: error as string,
    })
  }
}

function buildHedTsvFile(
  context: BIDSContext,
  hedValidator: typeof HedValidator,
): HedValidator.BidsTsvFile {
  return new hedValidator.BidsTsvFile(
    context.path,
    context.file,
    context.columns,
    context.sidecar,
  )
}

function buildHedSidecarFile(
  context: BIDSContext,
  hedValidator: typeof HedValidator,
): HedValidator.BidsSidecar {
  return new hedValidator.BidsSidecar(
    context.path,
    context.file,
    context.json,
  )
}

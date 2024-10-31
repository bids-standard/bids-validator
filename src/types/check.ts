import type { GenericSchema } from './schema.ts'
import type { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'

/** Function interface for writing a check */
export type ContextCheckFunction = (
  schema: GenericSchema,
  context: BIDSContext,
) => Promise<void>

/** Function interface for a check of context against a specific rule as accessed by its path in the schema.  */
export type RuleCheckFunction = (
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) => void

export type DSCheckFunction = (
  schema: GenericSchema,
  dsContext: BIDSContextDataset,
) => Promise<void>

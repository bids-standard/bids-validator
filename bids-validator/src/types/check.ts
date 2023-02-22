import { GenericSchema } from './schema.ts'
import { BIDSContext } from '../schema/context.ts'

/** Function interface for writing a check */
export type CheckFunction = (
  schema: GenericSchema,
  context: BIDSContext,
) => Promise<void>

/** Function interface for a check of context against a specific rule as accessed by its path in the schema.  */
export type RuleCheckFunction = (
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) => void

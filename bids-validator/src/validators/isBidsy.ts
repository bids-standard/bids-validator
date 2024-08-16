/**
 * Not sure if we want this yet. Would be to create issues for non standard
 * derivatives to have the lowest common denomenator of bids like file names.
 */
// @ts-nocheck
import type { BIDSContext } from '../schema/context.ts'
import type { ContextCheckFunction } from '../../types/check.ts'
import type { BIDSFile } from '../types/filetree.ts'
import type { Schema } from '../types/schema.ts'

export const isBidsyFilename: ContextCheckFunction = (schema, context) => {
  // every '.', '-', '_' followed by an alnum
  // only contains '.', '-', '_' and alnum
}

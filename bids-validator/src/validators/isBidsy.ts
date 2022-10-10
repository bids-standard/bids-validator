// @ts-nocheck
import { SEP } from '../deps/path.ts'
import { BIDSContext } from '../schema/context.ts'
import { CheckFunction } from '../../types/check.ts'
import { BIDSFile } from '../types/file.ts'
import { Schema } from '../types/schema.ts'

export const isBidsyFilename: CheckFunction = (schema, context) => {
  // every '.', '-', '_' followed by an alnum
  // only contains '.', '-', '_' and alnum
}

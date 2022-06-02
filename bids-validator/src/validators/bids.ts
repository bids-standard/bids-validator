import { FileTree } from '../types/filetree.ts'
import { walkFileTree } from '../schema/walk.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { applyRules } from '../schema/applyRules.ts'
import {
  checkDatatypes,
  checkLabelFormat,
  isAssociatedData,
  isAtRoot,
  isTopLevel,
} from './filenames.ts'

/**
 * Full BIDS schema validation entrypoint
 */
export async function validate(fileTree: FileTree): Promise<void> {
  const issues = []
  const schema = await loadSchema()
  for await (const context of walkFileTree(fileTree)) {
    if (isAssociatedData(schema, context.file.path)) {
      continue
    }
    if (!isTopLevel(schema, context)) {
      checkDatatypes(schema, context)
      checkLabelFormat(schema, context)
    }
    applyRules(schema, context)
  }
}

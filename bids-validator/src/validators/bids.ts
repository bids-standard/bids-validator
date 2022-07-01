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
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { ValidationResult } from '../types/validation-result.ts'
import { Summary } from '../summary/summary.ts'

/**
 * Full BIDS schema validation entrypoint
 */
export async function validate(fileTree: FileTree): Promise<ValidationResult> {
  const issues = new DatasetIssues()
  const summary = new Summary()
  // TODO - summary should be implemented in pure schema mode
  const schema = await loadSchema()
  for await (const context of walkFileTree(fileTree, issues)) {
    // TODO - Skip ignored files for now (some tests may reference ignored files)
    if (context.file.ignored) {
      continue
    }
    if (isAssociatedData(schema, context.file.path)) {
      continue
    }
    if (!isTopLevel(schema, context)) {
      checkDatatypes(schema, context)
      checkLabelFormat(schema, context)
    }
    applyRules(schema, context)
    await summary.update(context)
  }
  return {
    issues,
    summary: summary.formatOutput(),
  }
}

import { CheckFunction } from '../types/check.ts'
import { FileTree } from '../types/filetree.ts'
import { GenericSchema } from '../types/schema.ts'
import { ValidationResult } from '../types/validation-result.ts'
import { applyRules } from '../schema/applyRules.ts'
import { walkFileTree } from '../schema/walk.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { ValidatorOptions } from '../setup/options.ts'
import { Summary } from '../summary/summary.ts'
import { filenameIdentify } from './filenameIdentify.ts'
import { filenameValidate } from './filenameValidate.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { emptyFile } from './internal/emptyFile.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { BIDSFile } from '../types/file.ts'
import { parseOptions } from '../setup/options.ts'

/**
 * Ordering of checks to apply
 */
const CHECKS: CheckFunction[] = [
  emptyFile,
  filenameIdentify,
  filenameValidate,
  applyRules,
]

/**
 * Full BIDS schema validation entrypoint
 */
export async function validate(
  fileTree: FileTree,
  options: ValidatorOptions = parseOptions(undefined),
): Promise<ValidationResult> {
  const issues = new DatasetIssues()
  const summary = new Summary()
  const schema = await loadSchema()

  /* There should be a dataset_description in root, this will tell us if we
   * are dealing with a derivative dataset
   */
  const ddFile = fileTree.files.find(
    (file: BIDSFile) => file.name === 'dataset_description.json',
  )

  let dsContext
  if (ddFile) {
    const description = await ddFile.text().then((text) => JSON.parse(text))
    dsContext = new BIDSContextDataset(options, description)
  } else {
    dsContext = new BIDSContextDataset(options)
  }

  let derivativesSummary: Record<string, unknown> = {}
  fileTree.directories = fileTree.directories.filter((dir) => {
    if (dir.name === 'derivatives') {
      dir.directories.map((deriv) => {
        if (
          deriv.files.some(
            (file: BIDSFile) => file.name === 'dataset_description.json',
          )
        ) {
          const tempSummary = validate(deriv)
          derivativesSummary[deriv.name] = tempSummary
        }
      })
      return false
    }
    return true
  })

  for await (const context of walkFileTree(fileTree, issues, dsContext)) {
    // TODO - Skip ignored files for now (some tests may reference ignored files)
    if (context.file.ignored) {
      continue
    }

    await context.asyncLoads()
    // Run majority of checks
    for (const check of CHECKS) {
      // TODO - Resolve this double casting?
      await check(schema as unknown as GenericSchema, context)
    }
    await summary.update(context)
  }

  return {
    issues,
    summary: summary.formatOutput(),
  }
}

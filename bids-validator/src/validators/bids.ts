import { ContextCheckFunction, DSCheckFunction } from '../types/check.ts'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { loadJSON } from '../files/json.ts'
import { IssueFile } from '../types/issues.ts'
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
import { parseOptions } from '../setup/options.ts'
import { hedValidate } from './hed.ts'

/**
 * Ordering of checks to apply
 */
const perContextChecks: ContextCheckFunction[] = [
  emptyFile,
  filenameIdentify,
  filenameValidate,
  applyRules,
  hedValidate,
]

const perDSChecks: DSCheckFunction[] = []

/**
 * Full BIDS schema validation entrypoint
 */
export async function validate(
  fileTree: FileTree,
  options: ValidatorOptions,
): Promise<ValidationResult> {
  const summary = new Summary()
  const schema = await loadSchema(options.schema)
  summary.schemaVersion = schema.schema_version

  /* There should be a dataset_description in root, this will tell us if we
   * are dealing with a derivative dataset
   */
  const ddFile = fileTree.files.find(
    (file: BIDSFile) => file.name === 'dataset_description.json',
  )

  const dsContext = new BIDSContextDataset({options, schema, tree: fileTree})
  if (ddFile) {
    dsContext.dataset_description = await loadJSON(ddFile).catch((error) => {
      dsContext.issues.addNonSchemaIssue(error.key, [ddFile])
      return {} as Record<string, unknown>
    })
    summary.dataProcessed = dsContext.dataset_description.DatasetType === 'derivative'
  } else {
    dsContext.issues.addNonSchemaIssue('MISSING_DATASET_DESCRIPTION', [] as IssueFile[])
  }

  const bidsDerivatives: FileTree[] = []
  const nonstdDerivatives: FileTree[] = []
  fileTree.directories = fileTree.directories.filter((dir) => {
    if (dir.name !== 'derivatives') {
      return true
    }
    for (const deriv of dir.directories) {
      if (
        deriv.files.some(
          (file: BIDSFile) => file.name === 'dataset_description.json',
        )
      ) {
        // New root for the derivative dataset
        deriv.parent = undefined
        bidsDerivatives.push(deriv)
      } else {
        nonstdDerivatives.push(deriv)
      }
    }
    // Remove derivatives from the main fileTree
    return false
  })

  for await (const context of walkFileTree(dsContext)) {
    // TODO - Skip ignored files for now (some tests may reference ignored files)
    if (context.file.ignored) {
      continue
    }
    if (
      dsContext.dataset_description.DatasetType == 'raw' &&
      context.file.path.includes('derivatives')
    ) {
      continue
    }
    await context.asyncLoads()
    // Run majority of checks
    for (const check of perContextChecks) {
      await check(schema as unknown as GenericSchema, context)
    }
    await summary.update(context)
  }
  for (const check of perDSChecks) {
    await check(schema as unknown as GenericSchema, dsContext)
  }

  let derivativesSummary: Record<string, ValidationResult> = {}
  await Promise.allSettled(
    bidsDerivatives.map(async (deriv) => {
      derivativesSummary[deriv.name] = await validate(deriv, options)
      return derivativesSummary[deriv.name]
    }),
  )

  let output: ValidationResult = {
    issues: dsContext.issues,
    summary: summary.formatOutput(),
  }

  if (Object.keys(derivativesSummary).length) {
    output['derivativesSummary'] = derivativesSummary
  }
  return output
}

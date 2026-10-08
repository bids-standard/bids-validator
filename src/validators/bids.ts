import type { ContextCheckFunction, DSCheckFunction } from '../types/check.ts'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { loadJSON } from '../files/json.ts'
import type { Severity } from '../types/issues.ts'
import type { GenericSchema } from '../types/schema.ts'
import type { ValidationResult } from '../types/validation-result.ts'
import { applyRules } from '../schema/applyRules.ts'
import { walkFileTree } from '../schema/walk.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import type { Config, ValidatorOptions } from '../setup/options.ts'
import { Summary } from '../summary/summary.ts'
import { filenameCase } from './filenameCase.ts'
import { filenameIdentify } from './filenameIdentify.ts'
import { filenameValidate } from './filenameValidate.ts'
import { emptyFile } from './internal/emptyFile.ts'
import { sidecarWithoutDatafile, unusedStimulus } from './internal/unusedFile.ts'
import { BIDSContextDataset } from '../schema/context.ts'
import { hedValidate } from './hed.ts'
import { citationValidate } from './citation.ts'
import { logger } from '../utils/logger.ts'
import { subtree } from '../files/filetree.ts'

/**
 * Ordering of checks to apply
 */
const perContextChecks: ContextCheckFunction[] = [
  emptyFile,
  filenameIdentify,
  filenameValidate,
  filenameCase,
  applyRules,
  hedValidate,
]

const perDSChecks: DSCheckFunction[] = [
  unusedStimulus,
  sidecarWithoutDatafile,
  citationValidate,
]

/**
 * Validate a BIDS dataset against the BIDS schema.
 *
 * Loads the BIDS schema, walks the file tree, and applies file-level and
 * dataset-level checks, accumulating any issues into the returned
 * {@link ValidationResult}. Derivative datasets nested under
 * `derivatives/` are detected via their own `dataset_description.json`;
 * when `options.recursive` is set, BIDS-conformant derivatives are
 * validated and their results attached to `derivativesSummary` on the
 * returned object. Non-BIDS derivatives and the `sourcedata`, `code`
 * directories are ignored.
 *
 * `validate` does not throw on validation failures — it records them as
 * issues on the result. The returned `issues` collection can be filtered
 * or grouped via `DatasetIssues` methods. Set `options.ignoreWarnings`
 * to drop non-error issues from the output.
 *
 * @param fileTree - Root of the dataset to validate, typically produced
 *   by `readFileTree` (Deno) or `fileListToTree` (browser).
 * @param options - Per-run options. See {@link ValidatorOptions}.
 *   Notable fields include `recursive`, `ignoreWarnings`, and
 *   `blacklistModalities`.
 * @param config - Optional severity-override map. Each top-level key
 *   (`ignore`, `warning`, `error`) lists partial issue patterns;
 *   matching issues are reassigned to that severity after the run.
 * @returns A {@link ValidationResult} containing the accumulated
 *   issues, the run summary, and (when `options.recursive` is set)
 *   the per-derivative validation results.
 *
 * @example
 * ```ts
 * import { readFileTree } from '@bids/validator/files/deno'
 * import { validate } from '@bids/validator/validate'
 *
 * const tree = await readFileTree('/path/to/dataset')
 * const result = await validate(tree, {
 *   datasetPath: '/path/to/dataset',
 *   debug: 'ERROR',
 *   datasetTypes: [],
 *   blacklistModalities: [],
 * })
 * console.log(`${result.issues.size} issues found`)
 * ```
 */
export async function validate(
  fileTree: FileTree,
  options: ValidatorOptions,
  config?: Config,
): Promise<ValidationResult> {
  const summary = new Summary()
  const schema = await loadSchema(options.schema)
  summary.schemaVersion = schema.schema_version

  /* There should be a dataset_description in root, this will tell us if we
   * are dealing with a derivative dataset
   */
  const ddFile = fileTree.get('dataset_description.json') as BIDSFile

  const dsContext = new BIDSContextDataset({ options, schema, tree: fileTree })
  if (ddFile) {
    dsContext.dataset_description = await loadJSON(ddFile).catch((error) => {
      if (error.code) {
        dsContext.issues.add({ ...error, location: ddFile.path })
        return {} as Record<string, unknown>
      } else {
        throw error
      }
    })
    summary.dataProcessed = dsContext.dataset_description.DatasetType === 'derivative'
  } else {
    dsContext.issues.add({
      code: 'MISSING_DATASET_DESCRIPTION',
      affects: ['/dataset_description.json'],
    })
  }

  // Empty list defaults to allow all
  if (options.datasetTypes?.length) {
    const datasetType = (dsContext.dataset_description.DatasetType ?? 'raw') as string
    if (!options.datasetTypes.includes(datasetType)) {
      dsContext.issues.add({
        code: 'UNSUPPORTED_DATASET_TYPE',
        location: '/dataset_description.json',
        issueMessage: `"DatasetType": "${datasetType}"`,
      })
    }
  }

  const bidsDerivatives: Promise<FileTree>[] = []
  const nonstdDerivatives: FileTree[] = []
  fileTree.directories = fileTree.directories.filter((dir) => {
    if (['sourcedata', 'code'].includes(dir.name)) {
      return false
    }
    if (dir.name !== 'derivatives') {
      return true
    }
    for (const deriv of dir.directories) {
      if (deriv.get('dataset_description.json')) {
        bidsDerivatives.push(subtree(deriv))
      } else {
        nonstdDerivatives.push(deriv)
      }
    }
    // Remove derivatives from the main fileTree
    return false
  })

  logger.info('Performing file-level validation...')
  for await (const context of walkFileTree(dsContext, 20)) {
    if (
      dsContext.dataset_description.DatasetType == 'raw' &&
      context.file.path.includes('derivatives')
    ) {
      continue
    }
    // Run majority of checks
    for (const check of perContextChecks) {
      await check(schema as unknown as GenericSchema, context)
    }
    await summary.update(context)
  }

  logger.info('Performing dataset-level validation...')
  for (const check of perDSChecks) {
    await check(schema as unknown as GenericSchema, dsContext)
  }

  const modalitiesRule = schema.rules.modalities as Record<string, { datatypes: string[] }>
  const blacklistedDatatypes = new Map<string, string>()
  if (options.blacklistModalities) {
    // Map blacklisted datatypes back to the modality that generated them
    for (const modality of options.blacklistModalities) {
      const datatypes = modalitiesRule[modality.toLowerCase()]?.datatypes as string[]
      if (datatypes) {
        for (const datatype of datatypes) {
          blacklistedDatatypes.set(datatype, modality)
        }
      } else {
        logger.warn(`Attempted to blacklist unknown modality: ${modality}`)
      }
    }
  }

  const blacklistedDirs = fileTree.directories.filter((dir) => dir.name.startsWith('sub-'))
    .flatMap((dir) => dir.directories)
    .flatMap((dir) => dir.name.startsWith('ses-') ? dir.directories : [dir])
    .filter((dir) => blacklistedDatatypes.has(dir.name))

  blacklistedDirs.forEach((dir) => {
    dsContext.issues.add({
      code: 'BLACKLISTED_MODALITY',
      location: dir.path,
    })
  })

  const derivativesSummary: Record<string, ValidationResult> = {}
  if (options.recursive) {
    await Promise.allSettled(
      bidsDerivatives.map(async (promise) => {
        const deriv = await promise
        derivativesSummary[deriv.name] = await validate(deriv, options)
        return derivativesSummary[deriv.name]
      }),
    )
  }

  if (config) {
    for (const level of ['ignore', 'warning', 'error'] as const) {
      for (const filter of config[level] ?? []) {
        for (const issue of dsContext.issues.filter(filter).issues) {
          issue.severity = level as Severity
        }
      }
    }
  }

  if (options.ignoreWarnings) {
    dsContext.issues = dsContext.issues.filter({ severity: 'error' })
  }

  const output: ValidationResult = {
    issues: dsContext.issues,
    summary: summary.formatOutput(),
  }

  if (Object.keys(derivativesSummary).length) {
    output['derivativesSummary'] = derivativesSummary
  }
  return output
}

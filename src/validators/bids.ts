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
 * {@link ValidationResult}. Nested BIDS datasets are detected via their
 * own `dataset_description.json` under any of `derivatives/`,
 * `rawbids/`, or `sourcedata/` — either at the container's immediate
 * level (e.g. `rawbids/dataset_description.json`) or one level deeper
 * (e.g. `derivatives/fmriprep/dataset_description.json`). When
 * `options.recursive` is set, each nested BIDS dataset is validated
 * and its result is attached to `derivativesSummary` on the returned
 * object (the key name is retained for API compatibility but now also
 * covers non-derivative nested datasets). The `code` directory is
 * always ignored, as are non-BIDS contents of the nesting containers.
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
 * import { readFileTree } from '@bids/validator/files'
 * import { validate } from '@bids/validator/main'
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

  // Directories that may contain nested BIDS datasets — either the directory
  // itself is a BIDS dataset (e.g. `rawbids/dataset_description.json`) or its
  // immediate subdirectories are (e.g. `derivatives/fmriprep/`,
  // `sourcedata/ds00003/`).
  const nestingContainers = ['derivatives', 'rawbids', 'sourcedata']
  const bidsNestedDatasets: Promise<FileTree>[] = []
  const nonstdDerivatives: FileTree[] = []
  fileTree.directories = fileTree.directories.filter((dir) => {
    if (dir.name === 'code') {
      return false
    }
    if (!nestingContainers.includes(dir.name)) {
      return true
    }
    if (dir.get('dataset_description.json')) {
      bidsNestedDatasets.push(subtree(dir))
    } else {
      for (const sub of dir.directories) {
        if (sub.get('dataset_description.json')) {
          bidsNestedDatasets.push(subtree(sub))
        } else {
          nonstdDerivatives.push(sub)
        }
      }
    }
    // Always remove nesting containers from the main fileTree; their own
    // validation (if any) happens recursively below.
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

  const nestedDatasetsSummary: Record<string, ValidationResult> = {}
  if (options.recursive) {
    await Promise.allSettled(
      bidsNestedDatasets.map(async (promise) => {
        const nested = await promise
        nestedDatasetsSummary[nested.name] = await validate(nested, options)
        return nestedDatasetsSummary[nested.name]
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

  if (Object.keys(nestedDatasetsSummary).length) {
    // Keep the field name `derivativesSummary` for API stability; it now
    // holds results for all nested BIDS datasets, not just derivatives.
    output['derivativesSummary'] = nestedDatasetsSummary
  }
  return output
}

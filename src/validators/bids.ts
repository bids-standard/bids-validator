import type { ContextCheckFunction, DSCheckFunction } from '../types/check.ts'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { loadJSON } from '../files/json.ts'
import type { IssueFile, Severity } from '../types/issues.ts'
import type { GenericSchema } from '../types/schema.ts'
import type { ValidationResult } from '../types/validation-result.ts'
import { applyRules } from '../schema/applyRules.ts'
import { walkFileTree } from '../schema/walk.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import type { Config, ValidatorOptions } from '../setup/options.ts'
import { Summary } from '../summary/summary.ts'
import { filenameIdentify } from './filenameIdentify.ts'
import { filenameValidate } from './filenameValidate.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { emptyFile } from './internal/emptyFile.ts'
import { sidecarWithoutDatafile, unusedStimulus } from './internal/unusedFile.ts'
import { type BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import type { parseOptions } from '../setup/options.ts'
import { hedValidate } from './hed.ts'
import { citationValidate } from './citation.ts'
import { logger } from '../utils/logger.ts'

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

const perDSChecks: DSCheckFunction[] = [
  unusedStimulus,
  sidecarWithoutDatafile,
  citationValidate,
]

/**
 * Full BIDS schema validation entrypoint
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
      if (error.key) {
        dsContext.issues.add({ code: error.key, location: ddFile.path })
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

  const bidsDerivatives: FileTree[] = []
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
      bidsDerivatives.map(async (deriv) => {
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

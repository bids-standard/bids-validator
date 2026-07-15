import { LogLevelNames } from '@std/log'
import type { LevelName } from '@std/log'
import { Command, EnumType } from '@cliffy/command'
import { getVersion } from '../version.ts'
import type { Issue, Severity } from '../types/issues.ts'
import { schema } from '@bids/schema'

/**
 * Severity-keyed map of partial {@link Issue} patterns used to override
 * issue severities after a validation run.
 *
 * Each key (`'ignore'`, `'warning'`, `'error'`) maps to an array of partial
 * `Issue` records. Any issue that matches one of the patterns (via field
 * equality) is reassigned to that severity. This allows callers to silence
 * known issues or escalate warnings to errors without modifying the schema.
 */
export type Config = {
  [key in Severity]?: Partial<Issue>[]
}

/**
 * BIDS Validator options object definition
 */
export type ValidatorOptions = {
  /** Root directory of the dataset to validate. */
  datasetPath: string
  /** Version string or URL overriding the default bundled BIDS schema. */
  schema?: string
  /** Path to a JSON config file mapping severities to issue overrides (see {@link Config}). */
  config?: string
  /**
   * @deprecated Use `format: 'json'` instead.
   */
  json?: boolean // Deprecated, kept for backward compatibility
  /** Output format: `'text'` (default), `'json'`, or `'json_pp'` (pretty-printed JSON). */
  format?: string
  /** When `true`, include passing-rule details in the report. */
  verbose?: boolean
  /** When `true`, skip NIfTI header validation. */
  ignoreNiftiHeaders?: boolean
  /** When `true`, treat warnings as non-fatal; exit code 0 even when warnings are present. */
  ignoreWarnings?: boolean
  /** When `true`, validate filenames only, skipping file-content checks. */
  filenameMode?: boolean
  /** Logger verbosity level (e.g. `'ERROR'`, `'WARNING'`, `'DEBUG'`). */
  debug: LevelName
  /**
   * Force-enable or force-disable ANSI colour in `consoleFormat` output.
   * When unset, colour support is auto-detected from the TTY.
   */
  color?: boolean
  /** When `true`, descend into `derivatives/` subdirectories and validate them too. */
  recursive?: boolean
  /** Path to write the report to instead of stdout. */
  outfile?: string
  /** Restrict which `DatasetType` values are accepted (e.g. `['raw']`). */
  datasetTypes: string[]
  /** Modalities to refuse; validation fails if any of these are detected. */
  blacklistModalities: string[]
  /** When `true`, remove opaque directories (e.g., sourcedata/, derivatives/) before validation. */
  prune?: boolean
  /** Row cap for TSV validation; `0` validates headers only; unset or `-1` validates all rows. */
  maxRows?: number
  /** git-annex remote name to prefer when fetching content that is not locally present. */
  preferredRemote?: string
  /** Git ref to validate against; used with `readGitTree` from {@link [files/git]}. */
  gitRef?: string
}

const datasetType = new EnumType<string>(
  schema.objects.metadata.DatasetType.enum as string[],
)

const modalityType = new EnumType<string>(
  Object.keys(schema.rules.modalities),
)

const formatType = new EnumType<string>(['text', 'json', 'json_pp'])

/**
 * Extendable {@link https://cliffy.io/ Cliffy} `Command` that backs the
 * `bids-validator` CLI.
 *
 * Embedders that want to extend the CLI (add subcommands, override flag
 * handling, or wrap the standard run loop) should clone or extend this
 * command. Library consumers should call {@link [validate].validate}
 * directly with their own {@link ValidatorOptions} rather than going
 * through CLI plumbing.
 */
// deno-lint-ignore no-explicit-any
export const validateCommand: Command<void, void, any, string[], void> = new Command()
  .name('bids-validator')
  .type('debugLevel', new EnumType(LogLevelNames))
  .description(
    'This tool checks if a dataset in a given directory is compatible with the Brain Imaging Data Structure specification. To learn more about Brain Imaging Data Structure visit http://bids.neuroimaging.io',
  )
  .arguments('<dataset_directory>')
  .option('--json', '[Deprecated] Use --format json instead. Output machine readable JSON')
  .type('format', formatType)
  .option(
    '--format <format:format>',
    'Output format: text (default), json, or json_pp (pretty-printed JSON)',
    { default: 'text' },
  )
  .option(
    '-s, --schema <URL-or-tag:string>',
    'Specify a schema version to use for validation',
  )
  .option('-c, --config <file:string>', 'Path to a JSON configuration file')
  .option(
    '--max-rows <nrows:number>',
    'Maximum number of rows to validate in TSVs. Use 0 to validate headers only. Use -1 to validate all.',
    { default: 1000 },
  )
  .option('-v, --verbose', 'Log more extensive information about issues')
  .option('--ignoreWarnings', 'Disregard non-critical issues')
  .option(
    '--ignoreNiftiHeaders',
    'Disregard NIfTI header content during validation',
  )
  .option('--debug <level:debugLevel>', 'Enable debug output', {
    default: 'ERROR',
  })
  .option(
    '--filenameMode',
    'Enable filename checks for newline separated filenames read from stdin',
  )
  .type('datasetType', datasetType)
  .option(
    '--datasetTypes <datasetTypes:datasetType[]>',
    'Permitted dataset types to validate against (default: all)',
    { default: [] as string[] },
  )
  .type('modality', modalityType)
  .option(
    '--blacklistModalities <modalities:modality[]>',
    'Array of modalities to error on if detected.',
    { default: [] as string[] },
  )
  .option(
    '-r, --recursive',
    'Validate datasets found in derivatives directories in addition to root dataset',
  )
  .option(
    '-p, --prune',
    'Prune "opaque" BIDS directories from source tree before validation. ' +
      'WARNING: This is an extreme measure to reduce memory usage and IO operations but may change the results of validation.',
  )
  .option(
    '-o, --outfile <file:string>',
    'File to write validation results to.',
  )
  .option(
    '--preferredRemote <preferredRemote:string>',
    'Name of the preferred git-annex remote for accessing remote data (experimental)',
  )
  .option(
    '--git-ref [ref:string]',
    'Validate files from a git tree instead of the filesystem. Optional ref defaults to HEAD.',
  )

// Disabling color output is only available in Deno
if (typeof Deno !== 'undefined') {
  validateCommand
    .option(
      '--color, --no-color [color:boolean]',
      'Enable/disable color output (defaults to detected support)',
      {
        default: Deno.stdout.isTerminal() || !!Deno.env.get('FORCE_COLOR'),
      },
    )
}

/**
 * Parse command line options and return a {@link ValidatorOptions} config.
 *
 * @deprecated `parseOptions` will be removed in v4. Call
 *   {@link [validate].validate} with a {@link ValidatorOptions} object you
 *   construct yourself rather than relying on `Deno.args` parsing.
 *
 * @param argumentOverride - Argument array to parse instead of `Deno.args`.
 * @returns A fully populated `ValidatorOptions` derived from the parsed flags.
 */
export async function parseOptions(
  argumentOverride: string[] = Deno.args,
): Promise<ValidatorOptions> {
  const version = await getVersion()
  const { args, options } = await validateCommand.version(version)
    .parse(argumentOverride)
  return {
    datasetPath: args[0],
    ...options,
    debug: options.debug as LevelName,
    gitRef: options.gitRef === true ? 'HEAD' : options.gitRef as string | undefined,
  }
}

import { LogLevelNames } from '@std/log'
import type { LevelName } from '@std/log'
import { Command, EnumType } from '@cliffy/command'
import { getVersion } from '../version.ts'
import type { Issue, Severity } from '../types/issues.ts'
import { schema } from '@bids/schema'

/**
 * BIDS Validator config file object definition
 */
export type Config = {
  [key in Severity]?: Partial<Issue>[]
}

/**
 * BIDS Validator options object definition
 */
export type ValidatorOptions = {
  datasetPath: string
  schema?: string
  config?: string
  json?: boolean
  verbose?: boolean
  ignoreNiftiHeaders?: boolean
  ignoreWarnings?: boolean
  filenameMode?: boolean
  debug: LevelName
  color?: boolean
  recursive?: boolean
  outfile?: string
  blacklistModalities: string[]
  prune?: boolean
  maxRows?: number
}

const modalityType = new EnumType<string>(
  Object.keys(schema.rules.modalities),
)

/** Extendable Cliffy Command with built in BIDS validator options */
export const validateCommand: Command<void, void, any, string[], void> = new Command()
  .name('bids-validator')
  .type('debugLevel', new EnumType(LogLevelNames))
  .description(
    'This tool checks if a dataset in a given directory is compatible with the Brain Imaging Data Structure specification. To learn more about Brain Imaging Data Structure visit http://bids.neuroimaging.io',
  )
  .arguments('<dataset_directory>')
  .option('--json', 'Output machine readable JSON')
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
  .type('modality', modalityType)
  .option(
    '--blacklistModalities <...modalities:modality>',
    'Array of modalities to error on if detected.',
    { default: [] as string[] },
  )
  .option(
    '-r, --recursive',
    'Validate datasets found in derivatives directories in addition to root dataset',
  )
  .option(
    '-p, --prune',
    'Prune derivatives and sourcedata directories on load (disables -r and will underestimate dataset size)',
  )
  .option(
    '-o, --outfile <file:string>',
    'File to write validation results to.',
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
 * Parse command line options and return a ValidatorOptions config
 * @param argumentOverride Override the arguments instead of using Deno.args
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
  }
}

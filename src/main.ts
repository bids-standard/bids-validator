/* External */
import { resolve } from '@std/path'
import * as colors from '@std/fmt/colors'
/* Exported API */
import { readFileTree } from '@bids/validator/files/deno'
import { readGitTree } from '@bids/validator/files/git'
import { FileIgnoreRules } from '@bids/validator/filetree'
import { validate } from '@bids/validator/validate'
import { consoleFormat, resultToJSONStr } from '@bids/validator/output'
/* Purely internal */
import { setupLogging } from './utils/logger.ts'
import { parseOptions } from './setup/options.ts'
/* Types */
import type { Config, ValidationResult } from '@bids/validator/validate'

/**
 * Validation entrypoint intended for command line usage with Deno
 *
 * Parses command line options, runs validation, and formats the result. Call `validate` directly for other environments
 */
export async function main(): Promise<ValidationResult> {
  const options = await parseOptions(Deno.args)
  colors.setColorEnabled(options.color ?? false)
  setupLogging(options.debug)

  const absolutePath = resolve(options.datasetPath)
  const prune = options.prune
    ? new FileIgnoreRules(['derivatives', 'sourcedata', 'code'], false)
    : undefined
  const tree = options.gitRef
    ? await readGitTree(absolutePath, options.gitRef, prune, options.preferredRemote)
    : await readFileTree(absolutePath, prune, options.preferredRemote)

  const config = options.config ? JSON.parse(Deno.readTextFileSync(options.config)) as Config : {}

  // Run the schema based validator
  const schemaResult = await validate(tree, options, config)

  // Handle backward compatibility: if --json is used, override format
  const outputFormat = options.json ? 'json' : (options.format || 'text')

  let output_string = ''
  if (outputFormat === 'json') {
    output_string = resultToJSONStr(schemaResult, false)
  } else if (outputFormat === 'json_pp') {
    output_string = resultToJSONStr(schemaResult, true)
  } else {
    output_string = consoleFormat(schemaResult, {
      verbose: options.verbose ? options.verbose : false,
    })
  }

  if (options.outfile) {
    if (globalThis.Deno) {
      Deno.writeTextFileSync(options.outfile, output_string)
    } else {
      console.error('Output to file only supported in Deno runtime')
      console.log(output_string)
    }
  } else {
    console.log(output_string)
  }

  return schemaResult
}

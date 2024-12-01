import { parseOptions } from './setup/options.ts'
import type { Config } from './setup/options.ts'
import * as colors from '@std/fmt/colors'
import { readFileTree } from './files/deno.ts'
import { fileListToTree } from './files/browser.ts'
import { FileIgnoreRules } from './files/ignore.ts'
import { resolve } from '@std/path'
import { validate } from './validators/bids.ts'
import { consoleFormat, resultToJSONStr } from './utils/output.ts'
import { setupLogging } from './utils/logger.ts'
import type { ValidationResult } from './types/validation-result.ts'
export type { ValidationResult } from './types/validation-result.ts'

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
  const tree = await readFileTree(absolutePath, prune)

  const config = options.config ? JSON.parse(Deno.readTextFileSync(options.config)) as Config : {}

  // Run the schema based validator
  const schemaResult = await validate(tree, options, config)

  let output_string = ''
  if (options.json) {
    output_string = resultToJSONStr(schemaResult)
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

export { fileListToTree, validate }

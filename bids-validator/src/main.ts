import { parseOptions } from './setup/options.ts'
import type { Config } from './setup/options.ts'
import * as colors from '@std/fmt/colors'
import { readFileTree } from './files/deno.ts'
import { fileListToTree } from './files/browser.ts'
import { resolve } from '@std/path'
import { validate } from './validators/bids.ts'
import { consoleFormat } from './utils/output.ts'
import { setupLogging } from './utils/logger.ts'
import type { ValidationResult } from './types/validation-result.ts'

export async function main(): Promise<ValidationResult> {
  const options = await parseOptions(Deno.args)
  colors.setColorEnabled(options.color ?? false)
  setupLogging(options.debug)

  const absolutePath = resolve(options.datasetPath)
  const tree = await readFileTree(absolutePath)

  const config = options.config ? JSON.parse(Deno.readTextFileSync(options.config)) as Config : {}

  // Run the schema based validator
  const schemaResult = await validate(tree, options, config)

  if (options.json) {
    console.log(
      JSON.stringify(schemaResult, (key, value) => {
        if (value?.parent) {
          // Remove parent reference to avoid circular references
          value.parent = undefined
        }
        if (value instanceof Map) {
          return Object.fromEntries(value)
        } else {
          return value
        }
      }),
    )
  } else {
    console.log(
      consoleFormat(schemaResult, {
        verbose: options.verbose ? options.verbose : false,
      }),
    )
  }

  return schemaResult
}

export { fileListToTree, validate }

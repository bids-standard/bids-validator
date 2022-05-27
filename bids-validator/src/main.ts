import { parseOptions } from './setup/options.ts'
import { readFileTree } from './files/deno.ts'
import { resolve } from './deps/path.ts'
import { fullTestAdapter } from './compat/fulltest.ts'
import { validate } from './validators/bids.ts'
import { issues } from './issues/index.ts'

function inspect(obj: any) {
  console.log(
    Deno.inspect(obj, {
      depth: 6,
      colors: true,
    }),
  )
}

async function main() {
  const options = parseOptions(Deno.args)
  const absolutePath = resolve(options._[0])
  const tree = await readFileTree(absolutePath)

  // Run the schema based validator
  await validate(tree)

  if (options.schemaOnly) {
    inspect(issues.issues)
    // TODO - generate a summary without the old validator
  } else {
    const result = await fullTestAdapter(tree, options)
    issues.merge(result.issues.errors)
    issues.merge(result.issues.warnings)
    inspect(issues.issues)
    inspect(result.summary)
  }
}

await main()

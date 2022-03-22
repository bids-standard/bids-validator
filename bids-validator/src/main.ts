import { parseOptions } from './setup/options.ts'
import { readFileTree } from './files/deno.ts'
import { fullTestAdapter } from './fulltest.ts'

async function main() {
  const options = parseOptions(Deno.args)
  const tree = await readFileTree(options._[0])
  await fullTestAdapter(tree, options)
}

await main()

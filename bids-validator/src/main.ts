import { parseOptions } from './setup/options.ts'
import { readFileTree } from './files/deno.ts'

async function main() {
  const options = parseOptions(Deno.args)
  const tree = await readFileTree(options._[0])
  console.log(tree)
}

await main()

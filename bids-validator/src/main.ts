import { parseOptions } from './setup/options.ts'
import { readFileTree } from './files/deno.ts'
import { walkFileTree } from './schema/walk.ts'

async function main() {
  const options = parseOptions(Deno.args)
  const tree = await readFileTree(options._[0])
  for await (const context of walkFileTree(tree)) {
    console.log(context)
  }
}

await main()

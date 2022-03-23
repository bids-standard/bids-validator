/** Adapter to run Node.js bids-validator fullTest with minimal changes from Deno */
import { ValidatorOptions } from './setup/options.ts'
import { FileTree, BIDSFile } from './files/filetree.ts'
import { walkFileTree } from './schema/walk.ts'
import { createRequire } from './deps/node.ts'

const require = createRequire(import.meta.url)

export async function fullTestAdapter(
  tree: FileTree,
  options: ValidatorOptions,
) {
  const fullTest = require('../validators/bids/fullTest.js')
  const fileList: Array<BIDSFile> = []
  for await (const context of walkFileTree(tree)) {
    fileList.append(context.file)
  }

  fullTest(fileList, options, false, options._[0], false, () => {})
}

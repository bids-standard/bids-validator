/** Adapter to run Node.js bids-validator fullTest with minimal changes from Deno */
import { walkFileTree } from './schema/walk.ts'
import { fullTest } from '../validators/bids/fullTest.js'

export async function fullTestAdapter(tree, options, dir) {
  const fileList = []
  for await (const context of walkFileTree(tree)) {
    fileList.append(context.file)
  }
  fullTest(fileList, options, false, dir, false, () => {})
}

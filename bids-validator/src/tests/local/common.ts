import { readFileTree } from '../../files/deno.ts'
import { FileTree } from '../../types/filetree.ts'
import { validate } from '../../validators/bids.ts'
import { ValidationResult } from '../../types/validation-result.ts'
import { DatasetIssues } from '../../issues/datasetIssues.ts'
import { summary, formatSummary } from '../../summary/summary.ts'

export async function validatePath(
  t: Deno.TestContext,
  path: string,
): Promise<{ tree: FileTree; result: ValidationResult }> {
  let tree: FileTree = new FileTree('', '')
  let result: ValidationResult = {
    issues: new DatasetIssues(),
    summary: formatSummary(summary),
  }

  await t.step('file tree is read', async () => {
    tree = await readFileTree(path)
  })

  await t.step('completes validation', async () => {
    result = await validate(tree)
  })

  return { tree, result }
}

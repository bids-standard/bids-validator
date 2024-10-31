import { readFileTree } from '../../files/deno.ts'
import { FileTree } from '../../types/filetree.ts'
import { validate } from '../../validators/bids.ts'
import type { ValidationResult } from '../../types/validation-result.ts'
import type { Issue } from '../../types/issues.ts'
import { DatasetIssues } from '../../issues/datasetIssues.ts'
import { Summary } from '../../summary/summary.ts'
import { type Config, parseOptions, type ValidatorOptions } from '../../setup/options.ts'

export async function validatePath(
  t: Deno.TestContext,
  path: string,
  options: Partial<ValidatorOptions> = {},
  config: Config = {},
): Promise<{ tree: FileTree; result: ValidationResult }> {
  let tree: FileTree = new FileTree('', '')
  const summary = new Summary()
  let result: ValidationResult = {
    issues: new DatasetIssues(),
    summary: summary.formatOutput(),
  }

  await t.step('file tree is read', async () => {
    tree = await readFileTree(path)
  })

  await t.step('completes validation', async () => {
    result = await validate(tree, {
      ...(await parseOptions([path])),
      ...options,
    }, config)
  })

  return { tree, result }
}

export function formatAssertIssue(message: string, issue?: Issue[]) {
  if (issue && issue.length) {
    return `${message}\n${Deno.inspect(issue[0], { depth: 8, colors: true })}`
  } else {
    return `${message}\nAsserted issue is undefined`
  }
}

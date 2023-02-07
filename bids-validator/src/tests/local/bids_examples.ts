// Deno runtime tests for tests/data/valid_dataset
import { IssueOutput } from '../../types/issues.ts'
import { assert, assertEquals } from '../../deps/asserts.ts'
import { validatePath, formatAssertIssue } from './common.ts'

const options = { ignoreNiftiHeaders: true }

function useIssue(issue: IssueOutput): boolean {
  return (
    'schema.rules.checks.general.DuplicateFiles' !== issue.files[0].evidence &&
    issue.key !== 'EMPTY_FILE'
  )
}

const errors: string[] = ['dataset\tissueKey\tschemaPath\tfileName\n']
function formatBEIssue(issue: IssueOutput, dsPath: string) {
  if (useIssue(issue)) {
    errors.push(
      `${dsPath}\t${issue.key}\t${issue.files[0].evidence}\t${issue.files[0].file.name}\n`,
    )
  }
}

Deno.test('validate bids-examples', async (t) => {
  const prefix = 'tests/data/bids-examples'
  for (const dirEntry of Deno.readDirSync(prefix)) {
    if (!dirEntry.isDirectory) {
      continue
    }
    const path = `${prefix}/${dirEntry.name}`
    const { tree, result } = await validatePath(t, path, options)
    const output = result.issues.formatOutput()
    output.errors = output.errors.filter((x) => useIssue(x))
    output.errors.map((x) => formatBEIssue(x, dirEntry.name))
    await t.step(`${path} has no issues`, () => {
      assertEquals(output.errors.length, 0)
    })
  }
  Deno.writeTextFile('./bids_examples_issues.tsv', errors.join(''))
})

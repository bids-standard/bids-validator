// Deno runtime tests for tests/data/valid_dataset
import { IssueOutput } from '../../types/issues.ts'
import { assert, assertEquals } from '../../deps/asserts.ts'
import { validatePath, formatAssertIssue } from './common.ts'

const options = { ignoreNiftiHeaders: true }

function formatBEIssue(issue: IssueOutput) {
  return `${issue.key}: ${issue.files[0].evidence} ${issue.files[0].file.name}`
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
    const errorMessages = output.errors.map((x) => formatBEIssue(x))
    await t.step(`${path} has no issues`, () => {
      assertEquals(output.errors.length, 0, Deno.inspect(errorMessages))
    })
  }
})

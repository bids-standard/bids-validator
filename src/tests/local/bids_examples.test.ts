// Deno runtime tests for tests/data/valid_dataset
import { type assert, assertEquals } from '@std/assert'
import { Cell, Row, Table } from '@cliffy/table'
import * as colors from '@std/fmt/colors'
import type { Issue } from '../../types/issues.ts'
import type { DatasetIssues } from '../../issues/datasetIssues.ts'
import { type formatAssertIssue, validatePath } from './common.ts'
import { type Config, parseOptions } from '../../setup/options.ts'

const options = await parseOptions(['fake_dataset_arg', ...Deno.args])
options.ignoreNiftiHeaders = true
const config: Config = { 'ignore': [{ code: 'EMPTY_FILE' }] }

let header: string[] = ['issue key', 'filename', 'schema path']
header = header.map((x) => colors.magenta(x))

const errors: Row[] = []
function formatBEIssue(issue: Issue) {
  let code = issue.code
  if ('subCode' in issue && issue.subCode) {
    code = `${code} - ${issue.subCode}`
  }
  errors.push(
    Row.from([
      colors.red(code),
      issue.location,
      issue.issueMessage,
    ]),
  )
}

Deno.test('validate bids-examples', async (t) => {
  const prefix = 'tests/data/bids-examples'
  const dirEntries = Array.from(Deno.readDirSync(prefix))

  for (const dirEntry of dirEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!dirEntry.isDirectory || dirEntry.name.startsWith('.')) {
      continue
    }
    const path = `${prefix}/${dirEntry.name}`

    try {
      if (Deno.statSync(`${path}/.SKIP_VALIDATION`).isFile) {
        continue
      }
    } catch (e) {}
    const { tree, result } = await validatePath(t, path, options, config)
    const dsIssues = result.issues.filter({ 'severity': 'error' })
    await t.step(`${path} has no issues`, () => {
      assertEquals(dsIssues.size, 0)
    })
    if (dsIssues.size === 0) {
      continue
    }

    errors.push(
      Row.from([
        new Cell(colors.cyan(dirEntry.name)).colSpan(4),
        undefined,
        undefined,
        undefined,
      ]).border(true),
    )
    dsIssues.issues.map((x) => formatBEIssue(x))
  }
  const table = new Table()
    .header(header)
    .body(errors)
    .border(false)
    .padding(1)
    .indent(2)
    .maxColWidth(40)
    .toString()
  console.log(table)
})

import { DatasetIssues } from './datasetIssues.ts'

Deno.test('DatasetIssues management class', async (t) => {
  let issues
  await t.step('Constructor succeeds', async () => {
    issues = new DatasetIssues()
  })
})

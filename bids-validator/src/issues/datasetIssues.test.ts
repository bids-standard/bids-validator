import { assertEquals, assertObjectMatch } from '../deps/asserts.ts'
import { BIDSFile } from '../types/file.ts'
import { IssueFile } from '../types/issues.ts'
import { DatasetIssues, BIDSFileIssue } from './datasetIssues.ts'

Deno.test('DatasetIssues management class', async (t) => {
  await t.step('Constructor succeeds', async () => {
    new DatasetIssues()
  })
  await t.step('add an Issue', async () => {
    const issues = new DatasetIssues()
    issues.add({ key: 'TEST_ERROR', reason: 'Test issue' })
    assertEquals(issues.hasIssue({ key: 'TEST_ERROR' }), true)
  })
  await t.step('add Issue with several kinds of files', async () => {
    // This mostly tests the issueFile mapping function
    const issues = new DatasetIssues()
    const files = [
      {
        name: 'dataset_description.json',
        path: '/dataset_description.json',
        size: Promise.resolve(500),
        ignored: false,
        stream: Promise.resolve(new ReadableStream()),
      } as BIDSFile,
      {
        name: 'participants.tsv',
        path: '/participants.tsv',
        size: Promise.resolve(256),
        ignored: false,
        stream: Promise.resolve(new ReadableStream()),
        evidence: 'Something has gone wrong!',
        line: 15,
        character: 7,
      } as BIDSFileIssue,
      {
        key: 'TEST_FILES_ERROR',
        code: -50,
        file: { name: 'README', path: '/README', relativePath: '/README' },
        evidence: 'Test readme',
        line: 1,
        character: 5,
        severity: 'warning',
        reason: 'Readme borked',
        helpUrl: 'https://',
      } as IssueFile,
    ]
    issues.add({ key: 'TEST_FILES_ERROR', reason: 'Test issue', files })
    assertEquals(issues.getFileIssueKeys('/README'), ['TEST_FILES_ERROR'])
    for (const [key, issue] of issues.issues) {
      assertObjectMatch(issue, { key: 'TEST_FILES_ERROR' })
      for (const f of issue.files) {
        // Checking all files for the key assures they are in IssueFile format
        assertObjectMatch(f, {
          key: 'TEST_FILES_ERROR',
        })
      }
    }
  })
})

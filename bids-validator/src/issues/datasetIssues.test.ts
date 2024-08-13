import { assert, assertEquals, assertThrows } from '../deps/asserts.ts'
import { BIDSFile, FileTree } from '../types/filetree.ts'
import { IssueFile } from '../types/issues.ts'
import { DatasetIssues } from './datasetIssues.ts'

Deno.test('DatasetIssues management class', async (t) => {
  await t.step('Constructor succeeds', () => {
    new DatasetIssues()
  })
  await t.step('add Issue throws an error with bad error code', () => {
    const issues = new DatasetIssues()
    assertThrows(() => {
      issues.add({ code: '__NOT_A_REAL_CODE__' })
    })
  })

  await t.step('add Issue with several kinds of files', () => {
    const issues = new DatasetIssues()
    const testStream = new ReadableStream()
    const text = () => Promise.resolve('')
    const root = new FileTree('', '/', undefined)
    const files = [
      {
        text,
        name: 'dataset_description.json',
        path: '/dataset_description.json',
        size: 500,
        ignored: false,
        stream: testStream,
        parent: root,
        viewed: false,
      } as BIDSFile,
      {
        text,
        name: 'README',
        path: '/README',
        size: 500,
        ignored: false,
        stream: testStream,
        line: 1,
        character: 5,
        severity: 'warning',
        reason: 'Readme borked',
        parent: root,
        viewed: false,
      } as IssueFile,
    ]
    issues.add({ code: 'TEST_FILES_ERROR', location: files[1].path }, 'Test issue')
    const foundIssue = issues.get({ location: '/README' })
    assertEquals(foundIssue.length, 1)
    assertEquals(foundIssue[0].code, 'TEST_FILES_ERROR')
  })

  await t.step('test groupBy', () => {
    const issues = new DatasetIssues()
    issues.add({ code: 'NOT_INCLUDED', location: '/file_1' })
    issues.add({ code: 'NOT_INCLUDED', location: '/file_2' })
    issues.add({ code: 'EMPTY_FILE', location: '/file_1' })
    const byLoc = issues.groupBy('location')
    assert(byLoc !== undefined)
    const f1 = byLoc.get('/file_1')
    const f2 = byLoc.get('/file_2')
    assert(f1 !== undefined)
    assert(f2 !== undefined)
    assertEquals(f1.size, 2)
    assertEquals(f2.size, 1)

    const byCode = issues.groupBy('code')
    assert(byCode !== undefined)
    const code1 = byCode.get('NOT_INCLUDED')
    assert(code1 !== undefined)
    assertEquals(code1.size, 2)
  })
  await t.step('test multiple groupBy', () => {
    const issues = new DatasetIssues()
    issues.add({ code: 'NOT_INCLUDED', subCode: 'sub1', location: '/file_1' })
    issues.add({ code: 'NOT_INCLUDED', subCode: 'sub2', location: '/file_1' })
    issues.add({ code: 'NOT_INCLUDED', subCode: 'sub1', location: '/file_2' })
    issues.add({ code: 'NOT_INCLUDED', subCode: 'sub2', location: '/file_2' })
    issues.add({ code: 'EMPTY_FILE', location: '/file_1' })
  })
})

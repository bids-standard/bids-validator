import { assert, assertEquals, assertThrows } from '@std/assert'
import { pathsToTree } from '../files/filetree.ts'
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
    const root = pathsToTree([
      '/dataset_description.json',
      '/README',
    ])
    const issues = new DatasetIssues()
    issues.add({ code: 'TEST_FILES_ERROR', location: root.files[1].path }, 'Test issue')
    const foundIssue = issues.get({ location: '/README' })
    assertEquals(foundIssue.length, 1)
    assertEquals(foundIssue[0].code, 'TEST_FILES_ERROR')
  })

  await t.step('get issues with glob pattern', () => {
    const issues = new DatasetIssues()
    issues.add({ code: 'TEST_FILES_ERROR', location: '/acq-mprage_T1w.json' }, 'Test issue')
    issues.add({ code: 'TEST_FILES_ERROR', location: '/acq-memprage_T1w.json' }, 'Test issue')
    issues.add({ code: 'TEST_FILES_ERROR', location: '/acq-mb1_bold.json' }, 'Test issue')
    issues.add({ code: 'TEST_FILES_ERROR', location: '/acq-mb4_bold.json' }, 'Test issue')
    const foundIssue = issues.get({ location: '*_bold.json' })
    assertEquals(foundIssue.length, 2)
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
})

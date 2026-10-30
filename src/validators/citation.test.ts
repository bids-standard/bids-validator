import { assert, assertEquals, assertObjectMatch } from '@std/assert'
import { IssueError } from '../issues/datasetIssues.ts'
import { annexIssue } from '../files/annexKey.ts'
import { RejectingFileOpener } from '../files/openers.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { citationValidate } from './citation.ts'
import { BIDSContextDataset } from '../schema/context.ts'
import type { GenericSchema } from '../types/schema.ts'

Deno.test('citation validation', async (t) => {
  await t.step('no errors on the good citation.cff', async () => {
    const tree = pathsToTree(['CITATION.cff'])
    const dsContext = new BIDSContextDataset({ tree })
    const file = new BIDSFileDeno('tests/data/citation', 'good.cff')
    tree.files[0].text = () => file.text()
    await citationValidate({} as GenericSchema, dsContext)
    assert(dsContext.issues.size === 0)
  })
  await t.step('An error on the bad citation.cff', async () => {
    const tree = pathsToTree(['CITATION.cff'])
    const dsContext = new BIDSContextDataset({ tree })
    const file = new BIDSFileDeno('tests/data/citation', 'bad.cff')
    tree.files[0].text = () => file.text()
    await citationValidate({} as GenericSchema, dsContext)
    assert(dsContext.issues.get({ code: 'CITATION_CFF_VALIDATION_ERROR' }).length === 1)
  })
})

Deno.test('citation validation of files without content', async (t) => {
  const key = 'MD5E-s16--0123456789abcdef0123456789abcdef.cff'
  await t.step('an unresolvable CITATION.cff is left to its own context', async () => {
    const tree = pathsToTree(['CITATION.cff'])
    tree.files[0].opener = new RejectingFileOpener(16, annexIssue('UNLOCKED_ANNEX_DATA', key))
    const dsContext = new BIDSContextDataset({ tree })
    await citationValidate({} as GenericSchema, dsContext)
    assertEquals(dsContext.issues.size, 0)
  })
  await t.step('a read that rejects with an IssueError keeps its code', async () => {
    const tree = pathsToTree(['CITATION.cff'])
    const file = tree.files[0] as BIDSFile
    file.opener = {
      size: 0,
      stream: () => Promise.reject(new Error('unused')),
      readBytes: () => Promise.reject(new Error('unused')),
      resolve: () => Promise.resolve(),
      text: () => Promise.reject(new IssueError(annexIssue('UNAVAILABLE_ANNEX_DATA', key))),
    }
    const dsContext = new BIDSContextDataset({ tree })
    await citationValidate({} as GenericSchema, dsContext)
    const issues = dsContext.issues.get({})
    assertEquals(issues.length, 1)
    assertObjectMatch(issues[0], { code: 'UNAVAILABLE_ANNEX_DATA', location: 'CITATION.cff' })
  })
})

import { assertEquals } from '../deps/asserts.ts'
import { BIDSContext } from '../schema/context.ts'
import {
  _findRuleMatches,
  datatypeFromDirectory,
  hasMatch,
} from './filenameIdentify.ts'
import { BIDSFileDeno, FileTreeDeno } from '../files/deno.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { FileIgnoreRulesDeno } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const schema = await loadSchema()
const fileTree = new FileTreeDeno('/tmp', '/')
const issues = new DatasetIssues()
const ignore = new FileIgnoreRulesDeno([])

const node = {
  stem: 'testfile',
}

const recurseNode = {
  recurse: {
    suffixes: 'test',
  },
}

const schemaPath = 'test.schema.path'

Deno.test('test _findRuleMatches', async (t) => {
  // base case
  await t.step('Rule stem matches', () => {
    let file = new BIDSFileDeno('/tmp', '/tmp/testfile', ignore)
    let context = new BIDSContext(fileTree, file, issues)
    _findRuleMatches(node, schemaPath, context)
    assertEquals(context.filenameRules[0], schemaPath)
  })

  //recurse case
  await t.step('Non-terminal schema node, should recurse then match', () => {
    const file = new BIDSFileDeno('/tmp', '/tmp/silly-01_test.ext', ignore)
    const context = new BIDSContext(fileTree, file, issues)
    _findRuleMatches(recurseNode, schemaPath, context)
    assertEquals(context.filenameRules[0], `${schemaPath}.recurse`)
  })
})

Deno.test('test datatypeFromDirectory', (t) => {
  const filesToTest = [
    ['/sub-01/func/bad_filename.txt', 'func'],
    ['/sub-02/ses-01/anat/bad_filename.txt', 'anat'],
    ['/sub-02/ses-01/bad/bad_filename.txt', ''],
  ]
  filesToTest.map((test) => {
    const file = new BIDSFileDeno('/tmp', test[0], ignore)
    const context = new BIDSContext(fileTree, file, issues)
    datatypeFromDirectory(schema, context)
    assertEquals(context.datatype, test[1])
  })
})

Deno.test('test hasMatch', async (t) => {
  const file = new BIDSFileDeno('/tmp', '/tmp/silly-01_test.ext', ignore)
  const context = new BIDSContext(fileTree, file, issues)
  hasMatch(schema, context)

  await t.step('No  match', async () => {
    const file = new BIDSFileDeno('/tmp', '/tmp/silly-01_test.ext', ignore)
    const context = new BIDSContext(fileTree, file, issues)
    await hasMatch(schema, context)
    assertEquals(
      context.issues
        .getFileIssueKeys(context.file.path)
        .includes('NOT_INCLUDED'),
      true,
    )
  })
  await t.step('1 Rule Matched', async () => {
    const file = new BIDSFileDeno('/tmp', '/tmp/silly-01_test.ext', ignore)
    const context = new BIDSContext(fileTree, file, issues)
    context.filenameRules = ['schema.good.match']
    await hasMatch(schema, context)
  })
  await t.step('1+ matched, datatype match', async () => {
    const file = new BIDSFileDeno(
      '/tmp',
      '/sub-01/func/sub-01_events.json',
      ignore,
    )
    const context = new BIDSContext(fileTree, file, issues)
    context.filenameRules = [
      'rules.files.raw.task.events__mri',
      'rules.files.raw.task.events__pet',
    ]
    await hasMatch(schema, context)
    assertEquals(context.filenameRules.length, 1)
    assertEquals(context.filenameRules[0], 'rules.files.raw.task.events__mri')
  })
  await t.step('1+ matched, datatype reduce failed', async () => {
    const file = new BIDSFileDeno('/tmp', '/trc-tracer_events.json', ignore)
    const context = new BIDSContext(fileTree, file, issues)
    context.filenameRules = [
      'rules.files.raw.task.events__mri',
      'rules.files.raw.task.events__pet',
    ]
    await hasMatch(schema, context)
    assertEquals(context.filenameRules.length, 1)
    assertEquals(context.filenameRules[0], 'rules.files.raw.task.events__pet')
  })
})

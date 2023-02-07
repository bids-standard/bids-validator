import { assertEquals } from '../deps/asserts.ts'
import { BIDSContext } from '../schema/context.ts'
import {
  _findRuleMatches,
  datatypeFromDirectory,
  hasMatch,
} from './filenameIdentify.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { FileTree } from '../types/filetree.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const PATH = 'tests/data/valid_dataset'
const schema = await loadSchema()
const fileTree = new FileTree(PATH, '/')
const issues = new DatasetIssues()
const ignore = new FileIgnoreRules([])

const node = {
  stem: 'participants',
}

const recurseNode = {
  recurse: {
    suffixes: 'bold',
  },
}

const schemaPath = 'test.schema.path'

Deno.test('test _findRuleMatches', async (t) => {
  // base case
  await t.step('Rule stem matches', async () => {
    const fileName = 'participants.json'
    const file = new BIDSFileDeno(PATH, fileName, ignore)
    const context = new BIDSContext(fileTree, file, issues)
    _findRuleMatches(node, schemaPath, context)
    assertEquals(context.filenameRules[0], schemaPath)
  })

  //recurse case
  await t.step(
    'Non-terminal schema node, should recurse then match',
    async () => {
      const fileName = 'task-rest_bold.json'
      const file = new BIDSFileDeno(PATH, fileName, ignore)
      const context = new BIDSContext(fileTree, file, issues)
      _findRuleMatches(recurseNode, schemaPath, context)
      assertEquals(context.filenameRules[0], `${schemaPath}.recurse`)
    },
  )
})

Deno.test('test datatypeFromDirectory', (t) => {
  const filesToTest = [
    ['/sub-01/ses-01/func/sub-01_ses-01_task-nback_run-01_bold.nii', 'func'],
    ['/sub-01/ses-01/anat/sub-01_ses-01_T1w.nii', 'anat'],
  ]
  filesToTest.map((test) => {
    const file = new BIDSFileDeno(PATH, test[0], ignore)
    const context = new BIDSContext(fileTree, file, issues)
    datatypeFromDirectory(schema, context)
    assertEquals(context.datatype, test[1])
  })
})

Deno.test('test hasMatch', async (t) => {
  await t.step('hasMatch', async () => {
    const fileName =
      '/sub-01/ses-01/func/sub-01_ses-01_task-nback_run-01_bold.nii'
    const file = new BIDSFileDeno(PATH, fileName, ignore)
    const context = new BIDSContext(fileTree, file, issues)
    hasMatch(schema, context)
  })

  await t.step('No  match', async () => {
    const fileName = Deno.makeTempFileSync().split('/')[2]
    const file = new BIDSFileDeno('/tmp', fileName, ignore)

    const context = new BIDSContext(fileTree, file, issues)
    await hasMatch(schema, context)
    assertEquals(
      context.issues
        .getFileIssueKeys(context.file.path)
        .includes('NOT_INCLUDED'),
      true,
    )
  })
  await t.step('1+ matched, datatype match', async () => {
    const path = `${PATH}/../bids-examples/fnirs_automaticity`
    const fileName = 'events.json'
    const file = new BIDSFileDeno(path, fileName, ignore)
    const context = new BIDSContext(fileTree, file, issues)
    context.filenameRules = [
      'rules.files.raw.task.events__mri',
      'rules.files.raw.task.events__pet',
    ]
    await hasMatch(schema, context)
    assertEquals(context.filenameRules.length, 1)
    assertEquals(context.filenameRules[0], 'rules.files.raw.task.events__mri')
  })
})

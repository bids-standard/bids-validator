import { assertEquals } from '@std/assert'
import { SEPARATOR_PATTERN } from '@std/path'
import { BIDSContext } from '../schema/context.ts'
import {
  _findRuleMatches,
  datatypeFromDirectory,
  findDirRuleMatches,
  hasMatch,
} from './filenameIdentify.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const PATH = 'tests/data/valid_dataset'
const schema = await loadSchema()
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
    const context = new BIDSContext(file)
    _findRuleMatches(node, schemaPath, context)
    assertEquals(context.filenameRules[0], schemaPath)
  })

  //recurse case
  await t.step(
    'Non-terminal schema node, should recurse then match',
    async () => {
      const fileName = 'task-rest_bold.json'
      const file = new BIDSFileDeno(PATH, fileName, ignore)
      const context = new BIDSContext(file)
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
    const context = new BIDSContext(file)
    datatypeFromDirectory(schema, context)
    assertEquals(context.datatype, test[1])
  })
})

Deno.test('test hasMatch', async (t) => {
  await t.step('hasMatch', async () => {
    const fileName = '/sub-01/ses-01/func/sub-01_ses-01_task-nback_run-01_bold.nii'
    const file = new BIDSFileDeno(PATH, fileName, ignore)
    const context = new BIDSContext(file)
    hasMatch(schema, context)
  })

  await t.step('No match', async () => {
    const tmpFile = Deno.makeTempFileSync()
    const [dir, base] = tmpFile.split(SEPARATOR_PATTERN)
    const file = new BIDSFileDeno(dir, `/${base}`, ignore)

    const context = new BIDSContext(file)
    await hasMatch(schema, context)
    assertEquals(
      context.dataset.issues.get({
        location: context.file.path,
        code: 'NOT_INCLUDED',
      }).length,
      1,
    )
    Deno.removeSync(tmpFile)
  })
  await t.step('2 matches, no pruning', async () => {
    const path = `${PATH}/../bids-examples/fnirs_automaticity`
    const fileName = 'events.json'
    const file = new BIDSFileDeno(path, fileName, ignore)
    const context = new BIDSContext(file)
    context.filenameRules = [
      'rules.files.raw.task.events__mri',
      'rules.files.raw.task.events__pet',
    ]
    await hasMatch(schema, context)
    assertEquals(context.filenameRules.length, 2)
  })
})

Deno.test('test directoryIdentify', async (t) => {
  await t.step('Test entity based rule', async () => {
    const fileName = '/sub-01/'
    const file = new BIDSFileDeno(PATH, fileName, ignore)
    const context = new BIDSContext(file)
    context.directory = true
    await findDirRuleMatches(schema, context)
    assertEquals(context.filenameRules.length, 1)
    assertEquals(context.filenameRules[0], 'rules.directories.raw.subject')
  })
  await t.step('Test name based rule', async () => {
    const fileName = '/derivatives/'
    const file = new BIDSFileDeno(PATH, fileName, ignore)
    const context = new BIDSContext(file)
    context.directory = true
    await findDirRuleMatches(schema, context)
    assertEquals(context.filenameRules.length, 1)
    assertEquals(context.filenameRules[0], 'rules.directories.raw.derivatives')
  })
  await t.step('Test value based rule', async () => {
    const fileName = '/func/'
    const file = new BIDSFileDeno(`${PATH}/sub-01/ses-01`, fileName, ignore)
    const context = new BIDSContext(file)
    context.directory = true
    await findDirRuleMatches(schema, context)
    assertEquals(context.filenameRules.length, 1)
    assertEquals(context.filenameRules[0], 'rules.directories.raw.datatype')
  })
})

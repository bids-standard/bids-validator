import { GenericSchema } from '../types/schema.ts'
import { assertEquals } from '../deps/asserts.ts'
import { BIDSContext } from '../schema/context.ts'
import { missingLabel, atRoot, entityLabelCheck } from './filenameValidate.ts'
import { BIDSFileDeno, FileTreeDeno } from '../files/deno.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { FileIgnoreRulesDeno } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const schema = (await loadSchema()) as unknown as GenericSchema
const fileTree = new FileTreeDeno('/tmp', '/')
const issues = new DatasetIssues()
const ignore = new FileIgnoreRulesDeno([])

Deno.test('test missingLabel', async (t) => {
  await t.step('File with underscore and no hyphens errors out.', async () => {
    let file = {
      name: 'we_should_have_entites.wav',
      path: '/tmp/',
    } as BIDSFileDeno
    let context = new BIDSContext(fileTree, file, issues)
    await missingLabel(schema, context)
    assertEquals(
      context.issues
        .getFileIssueKeys(context.file.path)
        .includes('ENTITY_WITH_NO_LABEL'),
      true,
    )
  })

  await t.step(
    "File with underscores and hyphens doesn't error out.",
    async () => {
      let file = new BIDSFileDeno(
        '/tmp',
        'we-do_have-entities_suffix.wav',
        ignore,
      )
      let context = new BIDSContext(fileTree, file, issues)
      await missingLabel(schema, context)
      assertEquals(
        context.issues
          .getFileIssueKeys(context.file.path)
          .includes('ENTITY_WITH_NO_LABEL'),
        false,
      )
    },
  )
})

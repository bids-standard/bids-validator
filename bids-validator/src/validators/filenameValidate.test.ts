import { FileTree } from '../types/filetree.ts'
import { GenericSchema } from '../types/schema.ts'
import { assertEquals } from '../deps/asserts.ts'
import { BIDSContext } from '../schema/context.ts'
import { missingLabel, atRoot, entityLabelCheck } from './filenameValidate.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const schema = (await loadSchema()) as unknown as GenericSchema
const fileTree = new FileTree('/tmp', '/')
const issues = new DatasetIssues()
const ignore = new FileIgnoreRules([])

Deno.test('test missingLabel', async (t) => {
  await t.step('File with underscore and no hyphens errors out.', async () => {
    const fileName = Deno.makeTempFileSync({
      prefix: 'no_labels_',
      suffix: '_entities.wav',
    }).split('/')[2]
    let file = new BIDSFileDeno('/tmp', fileName, ignore)

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
      const fileName = Deno.makeTempFileSync({
        prefix: 'we-do_have-',
        suffix: '_entities.wav',
      }).split('/')[2]
      let file = new BIDSFileDeno('/tmp', fileName, ignore)
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

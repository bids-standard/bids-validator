import { assertEquals } from '../deps/asserts.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { simpleDataset, generateTestAnatFile } from '../tests/simple-dataset.ts'
import { FileTree } from '../types/filetree.ts'
import { GenericSchema } from '../types/schema.ts'
import { walkFileTree } from '../schema/walk.ts'

import { filenameValidate, atRoot, entityLabelCheck, missingLabel } from './filenameValidate.ts'

const schema = (await loadSchema()) as unknown as GenericSchema
const ignore = new FileIgnoreRules([])

Deno.test('test missingLabel', async (t) => {
  const tmpDir = Deno.makeTempDirSync()
  const fileTree = new FileTree(tmpDir, '/')
  await t.step('File with underscore and no hyphens errors out.', async () => {
    const basename = 'no_label_entities.wav'
    Deno.writeTextFileSync(`${tmpDir}/${basename}`, '')

    const context = new BIDSContext(
      new BIDSFileDeno(tmpDir, `/${basename}`, ignore),
      undefined,
      fileTree,
    )

    await missingLabel(schema, context)
    assertEquals(
      context.dataset.issues
        .getFileIssueKeys(context.file.path)
        .includes('ENTITY_WITH_NO_LABEL'),
      true,
    )
  })

  await t.step(
    "File with underscores and hyphens doesn't error out.",
    async () => {
      const basename = 'we-do_have-some_entities.wav'
      Deno.writeTextFileSync(`${tmpDir}/${basename}`, '')

      const context = new BIDSContext(
        new BIDSFileDeno(tmpDir, `/${basename}`, ignore),
        undefined,
        fileTree,
      )

      await missingLabel(schema, context)
      assertEquals(
        context.dataset.issues
          .getFileIssueKeys(context.file.path)
          .includes('ENTITY_WITH_NO_LABEL'),
        false,
      )
    },
  )
  Deno.removeSync(tmpDir, { recursive: true })
})

Deno.test('test unique datafile test.', async (t) => {
  const dsContext = new BIDSContextDataset({tree: simpleDataset})
  for await (const context of walkFileTree(dsContext)) {
    if (context.file.path.endsWith('.nii.gz')) {
      context.filenameRules = ['rules.files.raw.anat.nonparametric']
      const sibling = generateTestAnatFile()
      sibling.name = context.file.name.replace('.nii.gz', '.nii')
      sibling.path = context.file.path.replace('.nii.gz', '.nii')
      context.file.parent.files.push(sibling)
      await t.step("filenameValidate call on datafile completes", async () => {
        await filenameValidate(schema, context)
      })
      await t.step("it produces NON_UNIQUE_DATAFILE", async () => {
        assertEquals(
          context.dataset.issues
            .getFileIssueKeys(context.file.path)
            .includes('NON_UNIQUE_DATAFILE'),
          true
        )
      })
      return
    }
  }
})

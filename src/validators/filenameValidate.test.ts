import type { FileTree } from '../types/filetree.ts'
import type { GenericSchema } from '../types/schema.ts'
import { assertEquals } from '@std/assert'
import { BIDSContext } from '../schema/context.ts'
import { type atRoot, type entityLabelCheck, missingLabel } from './filenameValidate.ts'
import type { BIDSFileDeno } from '../files/deno.ts'
import { pathToFile } from '../files/filetree.ts'
import type { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const schema = (await loadSchema()) as unknown as GenericSchema

Deno.test('test missingLabel', async (t) => {
  await t.step('File with underscore and no hyphens errors out.', async () => {
    const context = new BIDSContext(pathToFile('/no_label_entities.wav'))
    // Need some suffix rule to trigger the check,
    // otherwise this is trigger-happy.
    context.filenameRules = ['rules.files.raw.dwi.dwi']

    await missingLabel(schema, context)
    assertEquals(
      context.dataset.issues
        .get({
          location: context.file.path,
          code: 'ENTITY_WITH_NO_LABEL',
        }).length,
      1,
    )
  })

  await t.step(
    "File with underscores and hyphens doesn't error out.",
    async () => {
      const context = new BIDSContext(pathToFile('/we-do_have-some_entities.wav'))
      // Doesn't really matter that the rule doesn't apply
      context.filenameRules = ['rules.files.raw.dwi.dwi']

      await missingLabel(schema, context)
      assertEquals(
        context.dataset.issues.get({
          location: context.file.path,
          code: 'ENTITY_WITH_NO_LABEL',
        }).length,
        0,
      )
    },
  )
})

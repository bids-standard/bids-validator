import { FileTree } from '../types/filetree.ts'
import { GenericSchema } from '../types/schema.ts'
import { assertEquals } from '../deps/asserts.ts'
import { BIDSContext } from '../schema/context.ts'
import { atRoot, entityLabelCheck, missingLabel } from './filenameValidate.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'

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
      const basename = 'we-do_have-some_entities.wav'
      Deno.writeTextFileSync(`${tmpDir}/${basename}`, '')

      const context = new BIDSContext(
        new BIDSFileDeno(tmpDir, `/${basename}`, ignore),
        undefined,
        fileTree,
      )

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
  Deno.removeSync(tmpDir, { recursive: true })
})

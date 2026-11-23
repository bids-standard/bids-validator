import type { GenericSchema, Schema } from '../types/schema.ts'
import { assertEquals } from '@std/assert'
import { makeBIDSContext } from '../schema/context.test.ts'
import { BIDSContextDataset } from '../schema/context.ts'
import { filenameValidate, missingLabel } from './filenameValidate.ts'
import { filenameIdentify } from './filenameIdentify.ts'
import { pathsToTree, pathToFile } from '../files/filetree.test.ts'
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { loadSchema } from '../setup/loadSchema.ts'

const schema = (await loadSchema()) as unknown as GenericSchema

Deno.test('test missingLabel', async (t) => {
  await t.step('File with underscore and no hyphens errors out.', async () => {
    const context = await makeBIDSContext(pathToFile('/no_label_entities.wav'))
    // Need some suffix rule to trigger the check,
    // otherwise this is trigger-happy.
    context.filenameRules = ['rules.files.raw.dwi.dwi']

    missingLabel(schema, context)
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
      const context = await makeBIDSContext(pathToFile('/we-do_have-some_entities.wav'))
      // Doesn't really matter that the rule doesn't apply
      context.filenameRules = ['rules.files.raw.dwi.dwi']

      missingLabel(schema, context)
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

function findFile(tree: FileTree, path: string): BIDSFile {
  const [head, ...rest] = path.split('/').filter(Boolean)
  if (rest.length === 0) {
    return tree.files.find((f) => f.name === head) as BIDSFile
  }
  return findFile(tree.directories.find((d) => d.name === head) as FileTree, rest.join('/'))
}

Deno.test('test datatype directory', async (t) => {
  const tree = pathsToTree([
    '/dataset_description.json',
    '/task-rest_bold.json',
    '/sub-01/ses-01/sub-01_ses-01_task-rest_bold.nii.gz',
    '/sub-01/ses-01/sub-01_ses-01_task-rest_bold.json',
    '/sub-01/ses-01/func/sub-01_ses-01_task-rest_run-1_bold.nii.gz',
  ])
  const dsContext = new BIDSContextDataset({ tree, schema: schema as unknown as Schema })

  async function datatypeIssues(path: string, code?: string) {
    const context = await makeBIDSContext(findFile(tree, path), dsContext, tree)
    filenameIdentify(schema, context)
    filenameValidate(schema, context)
    return context.dataset.issues.get({ location: path, code })
  }

  await t.step('Data file outside datatype directory errors out.', async () => {
    const issues = await datatypeIssues(
      '/sub-01/ses-01/sub-01_ses-01_task-rest_bold.nii.gz',
      'MISSING_DATATYPE',
    )
    assertEquals(issues.length, 1)
  })

  await t.step('Data file in datatype directory does not error out.', async () => {
    const issues = await datatypeIssues(
      '/sub-01/ses-01/func/sub-01_ses-01_task-rest_run-1_bold.nii.gz',
      'MISSING_DATATYPE',
    )
    assertEquals(issues.length, 0)
  })

  await t.step('Inherited sidecars outside datatype directory do not error out.', async () => {
    for (
      const path of ['/task-rest_bold.json', '/sub-01/ses-01/sub-01_ses-01_task-rest_bold.json']
    ) {
      assertEquals((await datatypeIssues(path, 'MISSING_DATATYPE')).length, 0)
    }
  })
})

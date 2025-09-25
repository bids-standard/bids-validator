import { assertEquals } from '@std/assert'
import { filenameCase } from './filenameCase.ts'
import { FileIgnoreRules } from '../files/ignore.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { pathsToTree } from '../files/filetree.ts'
import { BIDSFileDeno } from '../files/deno.ts'
import { BIDSContext, BIDSContextDataset } from '../schema/context.ts'
import { walkFileTree } from '../schema/walk.ts'
import { GenericSchema } from '../types/schema.ts'

const schema = await loadSchema()
const ignore = new FileIgnoreRules([])

const filesToTest = [
  '/file.txt',
  '/File.txt',
  '/FILE.txt',
  '/file.TXT',
  '/dir/file.txt',
  '/different_file.txt'
]

const fileTree = pathsToTree(filesToTest)

Deno.test('test filenameCase', async (t) => {
  const dsContext = new BIDSContextDataset({ tree: fileTree, schema: schema })
  for await (const context of walkFileTree(dsContext)) {
    await filenameCase(schema as unknown as GenericSchema, context)
  }
  const issues = dsContext.issues.get({code: 'CASE_COLLISION'})
  assertEquals(issues.length, 4)
})

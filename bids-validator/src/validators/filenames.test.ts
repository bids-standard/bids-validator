// @ts-nocheck
import { SEP } from '../deps/path.ts'
import { assertEquals } from '../deps/asserts.ts'
import {
  checkDatatypes,
  checkLabelFormat,
  datatypeFromDirectory,
} from './filenames.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { readEntities } from '../schema/entities.ts'
import { issues } from '../issues/index.ts'

const schema = await loadSchema()

const newContext = (path: string) => {
  const parts = path.split(SEP)
  const name = parts[parts.length - 1]
  return {
    file: {
      path: path,
      name: name,
    },
    modality: '',
    datatype: '',
    suffix: '',
    entities: [],
    extension: '',
  }
}

Deno.test('test datatypeFromDirectory', (t) => {
  const filesToTest = [
    ['/sub-01/func/bad_filename.txt', 'func'],
    ['/sub-02/ses-01/anat/bad_filename.txt', 'anat'],
    ['/sub-02/ses-01/bad/bad_filename.txt', ''],
  ]
  filesToTest.map((test) => {
    const context = newContext(test[0])
    datatypeFromDirectory(schema, context)
    assertEquals(context.datatype, test[1])
  })
})

Deno.test('test checkDatatype', (t) => {
  const filesToTest = [['/sub-01/func/sub-01_task-taskname_bold.json', []]]
  filesToTest.map((test) => {
    let context = newContext(test[0])
    context = { ...context, ...readEntities(context.file) }
    checkDatatypes(schema, context)
    assertEquals(issues.fileInIssues(test[0]), test[1])
  })
})

Deno.test('test checkLabelFormat', (t) => {
  const code = 'INVALID_ENTITY_LABEL'
  const filesToTest = [
    ['/sub-01/func/sub-01_task-taskname_bold.json', false],
    ['/sub-01/func/sub-01_task-+1_bold.json', true],
  ]
  filesToTest.map((test) => {
    let context = newContext(test[0])
    context = { ...context, ...readEntities(context.file) }
    checkLabelFormat(schema, context)
    assertEquals(issues.getFileIssueKeys(test[0]).includes(code), test[1])
  })
})

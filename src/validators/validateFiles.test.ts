import { assert, assertEquals } from '@std/assert'
import { filenameIdentify } from './filenameIdentify.ts'
import { filenameValidate } from './filenameValidate.ts'
import { BIDSContext } from '../schema/context.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import type { GenericSchema, Schema } from '../types/schema.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import { pathToFile } from '../files/filetree.ts'

const schema = await loadSchema() as unknown as GenericSchema

function validatePath(path: string): DatasetIssues {
  const context = new BIDSContext(pathToFile(path))
  filenameIdentify(schema, context)
  filenameValidate(schema, context)
  return context.dataset.issues
}

Deno.test('test valid paths', async (t) => {
  const validFiles = [
    '/README',
    '/CHANGES',
    '/dataset_description.json',
    '/participants.tsv',
    '/participants.json',
    '/sub-01/sub-01_sessions.tsv',
    '/sub-01/sub-01_sessions.json',
    '/sub-01/sub-01_dwi.bval',
    '/sub-01/sub-01_dwi.bvec',
    '/sub-01/sub-01_dwi.json',
    '/sub-01/sub-01_run-01_dwi.bval',
    '/sub-01/sub-01_run-01_dwi.bvec',
    '/sub-01/sub-01_run-01_dwi.json',
    '/sub-01/sub-01_acq-singleband_dwi.bval',
    '/sub-01/sub-01_acq-singleband_dwi.bvec',
    '/sub-01/sub-01_acq-singleband_dwi.json',
    '/sub-01/sub-01_acq-singleband_run-01_dwi.bval',
    '/sub-01/sub-01_acq-singleband_run-01_dwi.bvec',
    '/sub-01/sub-01_acq-singleband_run-01_dwi.json',
    '/sub-01/ses-test/sub-01_ses-test_dwi.bval',
    '/sub-01/ses-test/sub-01_ses-test_dwi.bvec',
    '/sub-01/ses-test/sub-01_ses-test_dwi.json',
    '/sub-01/ses-test/sub-01_ses-test_run-01_dwi.bval',
    '/sub-01/ses-test/sub-01_ses-test_run-01_dwi.bvec',
    '/sub-01/ses-test/sub-01_ses-test_run-01_dwi.json',
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_dwi.bval',
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_dwi.bvec',
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_dwi.json',
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_run-01_dwi.bval',
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_run-01_dwi.bvec',
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_run-01_dwi.json',
    '/phenotype/measurement_tool_name.tsv',
    '/phenotype/measurement_tool_name.json',
  ]
  for (const filename of validFiles) {
    await t.step(filename, async () => {
      const issues = validatePath(filename)
      assertEquals(
        issues.get({ location: filename }).length,
        0,
        Deno.inspect(issues),
      )
    })
  }
})

Deno.test('test invalid paths', async (t) => {
  const invalidFiles = [
    '/RADME', // wrong filename
    '/CANGES', // wrong filename
    '/dataset_descrption.json', // wrong filename
    '/dataset_description.jon', // wrong extension
    '/participants.sv', // wrong extension
    '/participnts.tsv', // wrong filename
    '/particpants.json', // wrong filename
    '/participants.son', // wrong extension
    '/sub-02/sub-01_sessions.tsv', // wrong sub id in the filename
    '/sub-01_sessions.tsv', // missed subject id dir
    '/sub-01/sub-01_sesions.tsv', // wrong modality
    '/sub-01/sub-01_sesions.ext', // wrong extension
    '/sub-01/sub-01_sessions.jon', // wrong extension
    '/sub-01/ses-ses/sub-01_dwi.bval', // redundant dir /ses-ses/
    '/sub-01/01_dwi.bvec', // missed subject suffix
    '/sub-01/sub_dwi.json', // missed subject id
    '/sub-01/sub-01_23_run-01_dwi.bval', // wrong _23_
    '/sub-01/sub-01_run-01_dwi.vec', // wrong extension
    '/sub-01/sub-01_run-01_dwi.jsn', // wrong extension
    '/sub-01/sub-01_acq_dwi.bval', // missed suffix value
    '/sub-01/sub-01_acq-23-singleband_dwi.bvec', // redundant -23-
    '/sub-01/anat/sub-01_acq-singleband_dwi.json', // redundant /anat/
    '/sub-01/sub-01_recrod-record_acq-singleband_run-01_dwi.bval', // redundant record-record_
    '/sub_01/sub-01_acq-singleband_run-01_dwi.bvec', // wrong /sub_01/
    '/sub-01/sub-01_acq-singleband__run-01_dwi.json', // wrong __
    '/sub-01/ses-test/sub-01_ses_test_dwi.bval', // wrong ses_test
    '/sub-01/ses-test/sb-01_ses-test_dwi.bvec', // wrong sb-01
    '/sub-01/ses-test/sub-01_ses-test_dw.json', // wrong modality
    '/sub-01/ses-test/sub-01_ses-test_run-01_dwi.val', // wrong extension
    '/sub-01/ses-test/sub-01_run-01_dwi.bvec', // missed session in the filename
    '/sub-01/ses-test/ses-test_run-01_dwi.json', // missed subject in the filename
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband.bval', // missed modality
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_dwi', // missed extension
    '/ses-test/sub-01/sub-01_ses-test_acq_singleband_dwi.json', // wrong dirs order
    '/sub-01/ses-test/sub-02_ses-test_acq-singleband_run-01_dwi.bval', // wrong sub id in the filename
    '/sub-01/sub-01_ses-test_acq-singleband_run-01_dwi.bvec', // ses dir missed
    '/ses-test/sub-01_ses-test_acq-singleband_run-01_dwi.json', // sub id dir missed
    '/sub-01/ses-test/sub-01_ses-test_run-01_acq-singleband_dwi.json', // incorrect entity order
    '/sub-01/ses-test/sub-01_ses-test_acq-singleband_acq-singleband_run-01_dwi.json', // entity appears twice
    '/measurement_tool_name.tsv', // missed phenotype dir
    '/phentype/measurement_tool_name.josn', // wrong phenotype dir
    '/phenotype/measurement_tool_name.jsn', // wrong extension
  ]
  for (const filename of invalidFiles) {
    await t.step(filename, async () => {
      const context = new BIDSContext(pathToFile(filename))
      await filenameIdentify(schema, context)
      await filenameValidate(schema, context)
      assert(
        context.dataset.issues.get({
          location: context.file.path,
        }).length > 0,
        `Matching filename rules: ${context.filenameRules}`,
      )
    })
  }
})

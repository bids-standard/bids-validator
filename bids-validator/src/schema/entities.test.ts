import { assert, assertObjectMatch } from '@std/assert'
import { readEntities } from './entities.ts'
import { nullReadBytes } from '../tests/nullReadBytes.ts'
import { generateBIDSFilename } from '../tests/generate-filenames.ts'

Deno.test('test readEntities', async (t) => {
  await t.step('test readEntities with a BIDSFile-like object', async () => {
    const testFile = {
      name: 'task-rhymejudgment_bold.json',
      path: '/task-rhymejudgment_bold.json',
      size: null as unknown as number,
      ignored: false,
      stream: null as unknown as ReadableStream<Uint8Array>,
      text: () => Promise.resolve(''),
      readBytes: nullReadBytes,
    }
    const context = readEntities(testFile.name)
    assert(context.stem === 'task-rhymejudgment_bold', 'failed to match stem')
    assert(context.extension === '.json', 'failed to match extension')
    assert(context.entities.task === 'rhymejudgment', 'failed to match entity')
    assert(context.suffix === 'bold', 'failed to match suffix')
  })

  await t.step('test readEntities("sub-01")', async () => {
    assertObjectMatch(readEntities('sub-01'), {
      stem: 'sub-01',
      entities: { sub: '01' },
      suffix: '',
      extension: '',
    })
  })
  await t.step('test readEntities("dataset_description.json")', async () => {
    assertObjectMatch(readEntities('dataset_description.json'), {
      stem: 'dataset_description',
      entities: { 'dataset': 'NOENTITY' },
      suffix: 'description',
      extension: '.json',
    })
  })
  await t.step('test readEntities("participants.tsv")', async () => {
    assertObjectMatch(readEntities('participants.tsv'), {
      stem: 'participants',
      entities: {},
      suffix: 'participants',
      extension: '.tsv',
    })
  })
  await t.step('test readEntities("sub-01_ses-01_T1w.nii.gz")', async () => {
    assertObjectMatch(readEntities('sub-01_ses-01_T1w.nii.gz'), {
      stem: 'sub-01_ses-01_T1w',
      entities: { sub: '01', ses: '01' },
      suffix: 'T1w',
      extension: '.nii.gz',
    })
  })
  await t.step('test readEntities("sub-01_SEM.ome.zarr")', async () => {
    assertObjectMatch(readEntities('sub-01_SEM.ome.zarr'), {
      stem: 'sub-01_SEM',
      entities: { sub: '01' },
      suffix: 'SEM',
      extension: '.ome.zarr',
    })
  })
  await t.step('test readEntities("sub-01_task-nback_meg")', async () => {
    assertObjectMatch(readEntities('sub-01_task-nback_meg'), {
      stem: 'sub-01_task-nback_meg',
      entities: { sub: '01', task: 'nback' },
      suffix: 'meg',
      extension: '',
    })
  })
})

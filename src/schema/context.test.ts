import { assert, assertEquals, assertObjectMatch } from '@std/assert'
import type { BIDSFile } from '../types/filetree.ts'
import type { FileTree } from '../types/filetree.ts'
import type { Schema } from '../types/schema.ts'
import { BIDSContext, BIDSContextDataset } from './context.ts'
import { dataFile, rootFileTree } from './fixtures.test.ts'

/* Async helper to create a loaded BIDSContext */
export async function makeBIDSContext(
  file: BIDSFile,
  dsContext?: BIDSContextDataset,
  fileTree?: FileTree,
): Promise<BIDSContext> {
  const context = new BIDSContext(file, dsContext, fileTree)
  await context.loaded
  return context
}

Deno.test('test context LoadSidecar', async (t) => {
  const context = await makeBIDSContext(dataFile)
  await t.step('sidecar overwrites correct fields', () => {
    assertObjectMatch(context.sidecar, {
      rootOverwrite: 'anat',
      subOverwrite: 'anat',
    })
  })
  await t.step('sidecar adds new fields at each level', () => {
    assertObjectMatch(context.sidecar, {
      rootValue: 'root',
      subValue: 'subject',
      anatValue: 'anat',
    })
  })
  await t.step('Warnings are emitted for overriding sidecar fields', () => {
    assertEquals(
      context.dataset.issues.get({ code: 'SIDECAR_FIELD_OVERRIDE' }).length,
      2,
    )
  })
})

Deno.test('BIDSContextDataset opaqueDirectories respects DatasetType', async (t) => {
  const schema = {
    objects: {
      extensions: {},
      metadata: { DatasetType: { enum: ['raw', 'derivative'] } },
    },
    rules: {
      directories: {
        raw: {
          a: { opaque: true, name: 'a' },
          b: { opaque: false, name: 'b' },
        },
        derivative: {
          c: { opaque: true, name: 'c' },
          d: { opaque: false, name: 'd' },
        },
      },
    },
  } as unknown as Schema

  await t.step('default (raw) DatasetType populates raw opaque dirs', () => {
    const ds = new BIDSContextDataset({ schema })
    assertEquals(ds.opaqueDirectories.has('/a'), true)
    assertEquals(ds.opaqueDirectories.has('/b'), false)
    assertEquals(ds.opaqueDirectories.has('/c'), false)
  })

  await t.step('updating dataset_description switches opaque dirs', () => {
    const ds = new BIDSContextDataset({ schema })
    ds.dataset_description = { DatasetType: 'derivative' }
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
    assertEquals(ds.opaqueDirectories.has('/d'), false)
  })

  await t.step('explicit derivative DatasetType on construction', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { DatasetType: 'derivative' },
    })
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
    assertEquals(ds.opaqueDirectories.has('/d'), false)
  })

  await t.step('resetting to raw restores raw opaque dirs', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { DatasetType: 'derivative' },
    })
    ds.dataset_description = { DatasetType: 'raw' }
    assertEquals(ds.opaqueDirectories.has('/a'), true)
    assertEquals(ds.opaqueDirectories.has('/b'), false)
    assertEquals(ds.opaqueDirectories.has('/c'), false)
  })

  await t.step('GeneratedBy infers derivative when DatasetType missing', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { GeneratedBy: [{ Name: 'foo' }] },
    })
    assertEquals(ds.dataset_description.DatasetType, 'derivative')
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
  })

  await t.step('invalid DatasetType normalizes to raw without GeneratedBy', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { DatasetType: 'Raw' },
    })
    assertEquals(ds.dataset_description.DatasetType, 'raw')
    assertEquals(ds.opaqueDirectories.has('/a'), true)
    assertEquals(ds.opaqueDirectories.has('/c'), false)
  })

  await t.step('invalid DatasetType normalizes to derivative with GeneratedBy', () => {
    const ds = new BIDSContextDataset({
      schema,
      dataset_description: { DatasetType: 'Derivative', GeneratedBy: [{ Name: 'x' }] },
    })
    assertEquals(ds.dataset_description.DatasetType, 'derivative')
    assertEquals(ds.opaqueDirectories.has('/c'), true)
    assertEquals(ds.opaqueDirectories.has('/a'), false)
  })
})

Deno.test('test context loadSubjects', async (t) => {
  const context = await makeBIDSContext(dataFile, undefined, rootFileTree)
  await t.step('context produces correct subjects object', () => {
    assert(context.dataset.subjects, 'subjects object exists')
    assert(context.dataset.subjects.sub_dirs.length == 1, 'there is only one sub dir found')
    assert(context.dataset.subjects.sub_dirs[0] == 'sub-01', 'that sub dir is sub-01')
    // no participants.tsv so this should be empty
    assert(context.dataset.subjects.participant_id == undefined, 'no participant_id is populated')
  })
})

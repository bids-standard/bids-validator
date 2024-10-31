import { assert, assertObjectMatch } from '@std/assert'
import { parseTIFF } from './tiff.ts'
import { BIDSFileDeno } from './deno.ts'

Deno.test('parseTIFF', async (t) => {
  await t.step('parse example file as TIFF', async () => {
    const file = new BIDSFileDeno(
      'tests/data/bids-examples/micr_SPIM',
      'sub-01/micr/sub-01_sample-A_stain-LFB_chunk-01_SPIM.ome.tif',
    )
    const { tiff, ome } = await parseTIFF(file, false)
    assert(tiff)
    assert(!ome)
    assertObjectMatch(tiff, {
      version: 42,
    })
  })
  await t.step('parse example file as OME-TIFF', async () => {
    const file = new BIDSFileDeno(
      'tests/data/bids-examples/micr_SPIM',
      'sub-01/micr/sub-01_sample-A_stain-LFB_chunk-01_SPIM.ome.tif',
    )
    const { tiff, ome } = await parseTIFF(file, true)
    assert(tiff)
    assert(ome)
    assertObjectMatch(tiff, {
      version: 42,
    })
    assertObjectMatch(ome, {
      PhysicalSizeX: 1,
      PhysicalSizeY: 1,
      PhysicalSizeZ: 1,
      PhysicalSizeXUnit: 'µm',
      PhysicalSizeYUnit: 'µm',
      PhysicalSizeZUnit: 'µm',
    })
  })
  await t.step('parse OME+BigTIFF file', async () => {
    const file = new BIDSFileDeno('tests/data/ome-tiff', 'btif_id.ome.tif')
    const { tiff, ome } = await parseTIFF(file, true)
    assert(tiff)
    assert(ome)
    assertObjectMatch(tiff, {
      version: 43,
    })
    assertObjectMatch(ome, {
      PhysicalSizeX: 1,
      PhysicalSizeY: 1,
      PhysicalSizeZ: 1,
      PhysicalSizeXUnit: 'µm',
      PhysicalSizeYUnit: 'µm',
      PhysicalSizeZUnit: 'µm',
    })
  })
})

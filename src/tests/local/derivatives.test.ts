import { assert } from '@std/assert'
import { validatePath } from './common.ts'
import { parseOptions } from '../../setup/options.ts'

Deno.test('recursive option works as expected', async (t) => {
  const path = 'tests/data/bids-examples/qmri_mp2rage/'
  let options = await parseOptions(['fake_dataset_arg', ...Deno.args])
  let result = await validatePath(t, path, options)
  assert(!Object.hasOwn(result.result, 'derivativesSummary'))
  options = await parseOptions(['fake_dataset_arg', ...Deno.args, '-r'])
  result = await validatePath(t, path, options)
  assert(Object.hasOwn(result.result, 'derivativesSummary'))
})

Deno.test('recursive option populates sourcesSummary from sourcedata/', async (t) => {
  // atlas-4S has sourcedata/atlas-4S/dataset_description.json — the
  // multiple-nested shape under sourcedata/.
  const path = 'tests/data/bids-examples/atlas-4S/'
  const options = await parseOptions(['fake_dataset_arg', ...Deno.args, '-r'])
  const result = await validatePath(t, path, options)
  assert(Object.hasOwn(result.result, 'sourcesSummary'))
  assert(
    Object.keys(result.result.sourcesSummary ?? {}).some((k) => k.includes('sourcedata')),
    'expected a sourcedata/ entry in sourcesSummary',
  )
})

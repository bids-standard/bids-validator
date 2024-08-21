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

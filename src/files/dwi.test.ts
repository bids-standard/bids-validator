import { assertEquals } from '@std/assert'

import { parseBvalBvec } from './dwi.ts'

Deno.test('Test bval/bvec parsing', async (t) => {
  await t.step('Load 3 bvals', () => {
    const bvals = parseBvalBvec('0 1 2 \n') // Typically ends with " \n"
    assertEquals(bvals, [['0', '1', '2']])
  })
  await t.step('Load 3 bvals - missing newline', () => {
    const bvals = parseBvalBvec('0 1 2 ')
    assertEquals(bvals, [['0', '1', '2']])
  })
  await t.step('Load 3 bvals - no spaces', () => {
    const bvals = parseBvalBvec('0 1 2')
    assertEquals(bvals, [['0', '1', '2']])
  })
  await t.step('Load 3 bvecs', () => {
    const bvecs = parseBvalBvec('0 1 2 \n0 1 2 \n0 1 2 \n')
    assertEquals(bvecs, [['0', '1', '2'], ['0', '1', '2'], ['0', '1', '2']])
  })
  await t.step('Load 3 bvals - missing newline', () => {
    const bvecs = parseBvalBvec('0 1 2 \n0 1 2 \n0 1 2 ')
    assertEquals(bvecs, [['0', '1', '2'], ['0', '1', '2'], ['0', '1', '2']])
  })
  await t.step('Load 3 bvals - no spaces', () => {
    const bvecs = parseBvalBvec('0 1 2\n0 1 2\n0 1 2\n')
    assertEquals(bvecs, [['0', '1', '2'], ['0', '1', '2'], ['0', '1', '2']])
  })
  await t.step('Load 3 bvals - no spaces, missing newline', () => {
    const bvecs = parseBvalBvec('0 1 2\n0 1 2\n0 1 2')
    assertEquals(bvecs, [['0', '1', '2'], ['0', '1', '2'], ['0', '1', '2']])
  })
})

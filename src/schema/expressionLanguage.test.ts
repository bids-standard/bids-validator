import { assert } from '@std/assert'
import { expressionFunctions } from './expressionLanguage.ts'
import { dataFile, rootFileTree } from './fixtures.test.ts'
import { BIDSContext } from './context.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'

Deno.test('test expression functions', async (t) => {
  const context = new BIDSContext(dataFile, undefined, rootFileTree)

  await t.step('index function', () => {
    const index = expressionFunctions.index
    assert(index([1, 2, 3], 2) === 1)
    assert(index([1, 2, 3], 4) === null)
    assert(index(['a', 'b', 'c'], 'b') === 1)
    assert(index(['a', 'b', 'c'], 'd') === null)
  })
  await t.step('intersects function', () => {
    const intersects = expressionFunctions.intersects
    const equal = expressionFunctions.allequal

    const truthy = (a: any): boolean => !!a

    assert(truthy(intersects([1, 2, 3], [2, 3, 4])))
    assert(intersects([1, 2, 3], [4, 5, 6]) === false)
    assert(truthy(intersects(['abc', 'def'], ['def'])))
    assert(intersects(['abc', 'def'], ['ghi']) === false)
    // Just checking values, I'm not concerned about types here
    // @ts-expect-error
    assert(equal(intersects([1, 2, 3], [2, 3, 4]), [2, 3]))
    // @ts-expect-error
    assert(equal(intersects(['abc', 'def'], ['def']), ['def']))

    // Promote scalars to arrays
    // @ts-ignore
    assert(truthy(intersects('abc', ['abc', 'def'])))
    // @ts-ignore
    assert(intersects('abc', ['a', 'b', 'c']) === false)
    // @ts-expect-error
    assert(equal(intersects('abc', ['abc', 'def']), ['abc']))
  })
  await t.step('match function', () => {
    const match = expressionFunctions.match
    assert(match('abc', 'abc') === true)
    assert(match('abc', 'def') === false)
    assert(match('abc', 'a.*') === true)
    assert(match('abc', 'd.*') === false)
  })
  await t.step('type function', () => {
    const type = expressionFunctions.type
    assert(type(1) === 'number')
    assert(type('abc') === 'string')
    assert(type([1, 2, 3]) === 'array')
    assert(type({ a: 1, b: 2 }) === 'object')
    assert(type(true) === 'boolean')
    assert(type(null) === 'null')
    assert(type(undefined) === 'null')
  })
  await t.step('min function', () => {
    const min = expressionFunctions.min
    assert(min([1, 2, 3]) === 1)
    assert(min([3, 2, 1]) === 1)
    assert(min([]) === Infinity)
    // @ts-ignore
    assert(min(['3', '2', '1']) === 1)
    // @ts-ignore
    assert(min(['3', 'string', '1']) === 1)
    // @ts-ignore
    assert(min(['3', 'n/a', '1']) === 1)
    // @ts-ignore
    assert(min(null) === null)
  })
  await t.step('max function', () => {
    const max = expressionFunctions.max
    assert(max([1, 2, 3]) === 3)
    assert(max([3, 2, 1]) === 3)
    assert(max([]) === -Infinity)
    // @ts-ignore
    assert(max(['3', '2', '1']) === 3)
    // @ts-ignore
    assert(max(['3', 'string', '1']) === 3)
    // @ts-ignore
    assert(max(['3', 'n/a', '1']) === 3)
    // @ts-ignore
    assert(max(null) === null)
  })
  await t.step('length function', () => {
    const length = expressionFunctions.length
    assert(length([1, 2, 3]) === 3)
    // Out-of-scope (but permitted) inputs
    // @ts-ignore
    assert(length('abc') === 3)
    // Out-of-scope inputs
    // @ts-ignore
    assert(length({ a: 1, b: 2 }) === null)
    // @ts-ignore
    assert(length(true) === null)
    // @ts-ignore
    assert(length(null) === null)
  })
  await t.step('count function', () => {
    const count = expressionFunctions.count
    assert(count(['a', 'b', 'a', 'b'], 'a') === 2)
    assert(count(['a', 'b', 'a', 'b'], 'c') === 0)
  })

  const exists = expressionFunctions.exists.bind(context)
  await t.step('exists(..., "dataset") function', () => {
    assert(exists([], 'dataset') === 0)
    assert(
      exists(['sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz'], 'dataset') === 1,
    )
    assert(
      exists(
        ['sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz', 'T1w.json'],
        'dataset',
      ) === 2,
    )
  })
  await t.step('exists(..., "subject") function', () => {
    assert(exists([], 'subject') === 0)
    assert(exists(['ses-01/anat/sub-01_ses-01_T1w.nii.gz'], 'subject') === 1)
    assert(
      exists(
        ['ses-01/anat/sub-01_ses-01_T1w.nii.gz', 'T1w.json'],
        'subject',
      ) === 1,
    )
  })
  await t.step('exists(..., "file") function', () => {
    assert(exists([], 'file') === 0)
    assert(exists(['sub-01_ses-01_T1w.nii.gz'], 'file') === 1)
    assert(exists(['sub-01_ses-01_T1w.nii.gz', 'sub-01_ses-01_T1w.json'], 'file') === 2)
    assert(exists(['sub-01_ses-01_T1w.nii.gz', 'ses-01_T1w.json'], 'file') === 1)
  })
  await t.step('exists(..., "stimuli") function', () => {
    assert(exists([], 'stimuli') === 0)
    assert(exists(['stimfile1.png'], 'stimuli') === 1)
    assert(exists(['stimfile1.png', 'stimfile2.png'], 'stimuli') === 2)
    assert(exists(['X.png', 'Y.png'], 'stimuli') === 0)
  })
  await t.step('exists(..., "bids-uri") function', () => {
    assert(exists([], 'subject') === 0)
    assert(
      exists(
        ['bids::sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz'],
        'bids-uri',
      ) === 1,
    )
    assert(
      exists(
        ['bids::sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz', 'bids::T1w.json'],
        'bids-uri',
      ) === 2,
    )
    // Not yet implemented; currently returns length of array
    // assert(exists(['bids::sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz', 'bids::T2w.json'], 'bids-uri') === 1)
  })

  await t.step('substr function', () => {
    const substr = expressionFunctions.substr
    assert(substr('abc', 0, 1) === 'a')
    assert(substr('abc', 1, 2) === 'b')
    assert(substr('abc', 2, 3) === 'c')
    assert(substr('abc', 3, 4) === '')
    assert(substr('abc', 0, 4) === 'abc')
    // @ts-ignore
    assert(substr(null, 0, 1) === null)
    // @ts-ignore
    assert(substr('abc', null, 1) === null)
    // @ts-ignore
    assert(substr('abc', 0, null) === null)
  })
  await t.step('sorted(..., "numeric") function', () => {
    const sorted = expressionFunctions.sorted
    const array_equal = (a: any[], b: any[]) =>
      a.length === b.length && a.every((v, i) => v === b[i])
    assert(array_equal(sorted([3, 2, 1], 'numeric'), [1, 2, 3]))
    assert(array_equal(sorted([1, 2, 3], 'numeric'), [1, 2, 3]))
    assert(array_equal(sorted(['3', '2', '1'], 'numeric'), ['1', '2', '3']))
    assert(array_equal(sorted(['1', '2', '3'], 'numeric'), ['1', '2', '3']))
    assert(array_equal(sorted([], 'numeric'), []))
    assert(array_equal(sorted([5, 25, 125, 625], 'numeric'), [5, 25, 125, 625]))
    assert(array_equal(sorted([125, 25, 5, 625], 'numeric'), [5, 25, 125, 625]))
    assert(
      array_equal(sorted(['-2', '-1', '0', '1', '2'], 'numeric'), ['-2', '-1', '0', '1', '2']),
    )
  })
  await t.step('sorted(..., "lexical") function', () => {
    const sorted = expressionFunctions.sorted
    const array_equal = (a: any[], b: any[]) =>
      a.length === b.length && a.every((v, i) => v === b[i])
    assert(array_equal(sorted([3, 2, 1], 'lexical'), [1, 2, 3]))
    assert(array_equal(sorted([1, 2, 3], 'lexical'), [1, 2, 3]))
    assert(array_equal(sorted(['3', '2', '1'], 'lexical'), ['1', '2', '3']))
    assert(array_equal(sorted(['1', '2', '3'], 'lexical'), ['1', '2', '3']))
    assert(array_equal(sorted([], 'lexical'), []))
    assert(
      array_equal(sorted(['5', '25', '125', '625'], 'lexical'), [
        '125',
        '25',
        '5',
        '625',
      ]),
    )
    assert(
      array_equal(sorted(['125', '25', '5', '625'], 'lexical'), [
        '125',
        '25',
        '5',
        '625',
      ]),
    )
  })
  await t.step('sorted(..., "auto") function', () => {
    const sorted = expressionFunctions.sorted
    const array_equal = (a: any[], b: any[]) =>
      a.length === b.length && a.every((v, i) => v === b[i])
    assert(array_equal(sorted([125, 25, 5, 625], 'auto'), [5, 25, 125, 625]))
    assert(
      array_equal(sorted(['5', '25', '125', '625'], 'auto'), [
        '125',
        '25',
        '5',
        '625',
      ]),
    )
  })
  await t.step('allequal function', () => {
    const allequal = expressionFunctions.allequal
    assert(allequal([1, 2, 1], [1, 2, 1]) === true)
    assert(allequal([1, 2, 1], [1, 2, 3]) === false)
    assert(allequal(['a', 'b', 'a'], ['a', 'b', 'a']) === true)
    assert(allequal(['a', 'b', 'a'], ['a', 'b', 'c']) === false)
    assert(allequal([1, 2, 1], [1, 2, 1, 2]) === false)
    assert(allequal([1, 2, 1, 2], [1, 2, 1]) === false)
  })
})

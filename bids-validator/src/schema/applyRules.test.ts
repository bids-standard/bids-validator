// @ts-nocheck
import { assert, assertEquals } from '@std/assert'
import { applyRules, evalCheck, evalConstructor } from './applyRules.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { expressionFunctions } from './expressionLanguage.ts'

const ruleContextData = [
  {
    path: ['rules', 'checks', 'dwi', 'DWIVolumeCount'],
    context: {
      suffix: 'dwi',
      associations: {
        bvec: {
          n_cols: 4,
        },
        bval: {
          n_cols: 4,
        },
      },
      nifti_header: {
        dim: [0, 0, 0, 0, 4],
      },
    },
  },
]

const schemaDefs = {
  rules: {
    checks: {
      dwi: {
        DWIVolumeCount: {
          code: 'VOLUME_COUNT_MISMATCH',
          description:
            'The number of volumes in this scan does not match the number of volumes in the\ncorresponding .bvec a...',
          level: 'error',
          selectors: [
            'suffix == "dwi"',
            '"bval" in associations',
            '"bvec" in associations',
          ],
          checks: [
            'associations.bval.n_cols == nifti_header.dim[4]',
            'associations.bvec.n_cols == nifti_header.dim[4]',
          ],
        },
      },
    },
  },
}

Deno.test('evalCheck test', () => {
  ruleContextData.map((rcd) => {
    const rule = rcd.path.reduce((obj, key) => obj[key], schemaDefs)
    rule.selectors.map((selector: string) => {
      assert(evalCheck(selector, rcd.context), `${selector}, ${rcd.context}`)
    })
    rule.checks.map((check: string) => {
      assert(evalCheck(check, rcd.context), `${check}, ${rcd.context}`)
    })
  })
})

Deno.test('evalCheck ensure constructor access', () => {
  assert(
    evalCheck('foo.constructor.isArray(foo)', { foo: [1] }),
    'can not access Array prototype via constructor',
  )
})

Deno.test('evalCheck built in apis fail', () => {
  assert(evalCheck('fetch', {}) === undefined, 'fetch in evalCheck namespace')
})

Deno.test('evalCheck ensure expression language functions work', () => {
  const context = {
    x: [1, 2, 3, 4],
    y: [1, 1, 1, 1],
    dataset: { issues: new DatasetIssues() },
  }
  const rule = [
    {
      selectors: ['true'],
      checks: [
        'intersects(x, y)',
        'match("teststr", "est")',
        'type(x) == "array" && type(5) == "number"',
        'max(x) == 4',
        'min(x) == min(y)',
        'length(y) == count(y, 1)',
      ],
    },
  ]
  applyRules(rule, context)
  assertEquals(context.dataset.issues.get({ code: 'CHECK_ERROR' }).length, 0)
})
Deno.test(
  'evalCheck ensure expression language will fail appropriately',
  () => {
    const context = { dataset: { issues: new DatasetIssues() } }
    const rule = [
      {
        selectors: ['true'],
        checks: ['length(1)'],
      },
    ]
    applyRules(rule, context)
    assertEquals(context.dataset.issues.get({ code: 'CHECK_ERROR' }).length, 1)
  },
)

Deno.test('evalConstructor test', async (t) => {
  const match = expressionFunctions.match
  await t.step('check veridical reconstruction of match expressions', () => {
    // match() functions frequently contain escapes in regex patterns
    // We receive these from the schema as written in YAML, so we need to ensure
    // that they are correctly reconstructed in the evalConstructor() function
    //
    // The goal is to avoid schema authors needing to double-escape their regex patterns
    // and other implementations to account for the double-escaping
    let pattern = String.raw`^\.nii(\.gz)?$`

    // Check both a literal and a variable pattern produce the same result
    for (const check of ['match(extension, pattern)', `match(extension, '${pattern}')`]) {
      const niftiCheck = evalConstructor(check)
      for (
        const [extension, expected] of [
          ['.nii', true],
          ['.nii.gz', true],
          ['.tsv', false],
          [',nii,gz', false], // Check that . is not treated as a wildcard
        ]
      ) {
        assert(match(extension, pattern) === expected)
        // Pass in a context object to provide any needed variables
        assert(niftiCheck({ match, extension, pattern }) === expected)
      }
    }

    pattern = String.raw`\S`
    for (const check of ['match(json.Name, pattern)', `match(json.Name, '${pattern}')`]) {
      const nonEmptyCheck = evalConstructor(check)
      for (
        const [Name, expected] of [
          ['test', true],
          ['', false],
          [' ', false],
        ]
      ) {
        assert(match(Name, pattern) === expected)
        assert(nonEmptyCheck({ match, json: { Name }, pattern }) === expected)
      }
    }
  })
})

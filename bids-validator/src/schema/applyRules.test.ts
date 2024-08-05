// @ts-nocheck
import { assert, assertEquals, assertObjectMatch } from '../deps/asserts.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { applyRules, evalCheck, evalColumns, evalConstructor } from './applyRules.ts'
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
    tabular_data: {
      modality_agnostic: {
        Scans: {
          selectors: ['suffix == "scans"', 'extension == ".tsv"'],
          initial_columns: ['filename'],
          columns: {
            filename: {
              level: 'required',
              description_addendum: 'There MUST be exactly one row for each file.',
            },
            acq_time__scans: 'optional',
          },
          index_columns: ['filename'],
          additional_columns: 'allowed',
        },
      },
      made_up: {
        MadeUp: {
          columns: {
            onset: 'required',
            strain_rrid: 'optional',
          },
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
    issues: new DatasetIssues(),
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
  assertEquals(context.issues.get({ code: 'CHECK_ERROR' }).length, 0)
})
Deno.test(
  'evalCheck ensure expression language will fail appropriately',
  () => {
    const context = { issues: new DatasetIssues() }
    const rule = [
      {
        selectors: ['true'],
        checks: ['length(1)'],
      },
    ]
    applyRules(rule, context)
    assertEquals(context.issues.get({ code: 'CHECK_ERROR' }).length, 1)
  },
)

Deno.test('evalColumns tests', async (t) => {
  const schema = await loadSchema()

  await t.step('check invalid datetime (scans.tsv:acq_time)', () => {
    const context = {
      path: '/sub-01/sub-01_scans.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        filename: ['func/sub-01_task-rest_bold.nii.gz'],
        acq_time: ['1900-01-01T00:00:78'],
      },
      issues: new DatasetIssues(),
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Scans
    evalColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(context.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE_NONREQUIRED' }).length, 1)
  })

  await t.step('check formatless column', () => {
    const context = {
      path: '/sub-01/sub-01_something.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        onset: ['1', '2', 'not a number'],
      },
      issues: new DatasetIssues(),
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE' }).length, 1)
  })

  await t.step('verify n/a is allowed', () => {
    const context = {
      path: '/sub-01/sub-01_something.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        onset: ['1', '2', 'n/a'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
      },
      issues: new DatasetIssues(),
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.issues.size, 0)
  })
})

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

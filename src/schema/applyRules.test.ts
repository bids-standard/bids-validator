// @ts-nocheck test file uses untyped schema stubs and dynamic rule structures
import { assert, assertEquals } from '@std/assert'
import { applyRules, evalCheck } from './applyRules.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { loadSchema } from '../setup/loadSchema.ts'
import { BIDSContext, BIDSContextDataset } from './context.ts'

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

Deno.test('content-unavailable contexts', async (t) => {
  const schema = await loadSchema()

  /* Apply all rules to a file with and without content, returning the issues of each run */
  async function applyWithAndWithoutContent(path: string, fields: Partial<BIDSContext>) {
    const tree = pathsToTree([path])
    const dsContext = new BIDSContextDataset({ schema, tree })
    const context = new BIDSContext(tree.get(path.slice(1)), dsContext, tree)
    await context.loaded
    Object.assign(context, fields)
    const runs = {}
    for (const contentAvailable of [true, false]) {
      dsContext.issues = new DatasetIssues()
      context.contentAvailable = contentAvailable
      applyRules(schema, context)
      runs[contentAvailable] = dsContext.issues
    }
    return runs
  }

  const codes = (issues: DatasetIssues) => issues.get({}).map((issue) => issue.code)

  await t.step('dataset_description.json fields are not checked', async () => {
    const runs = await applyWithAndWithoutContent('/dataset_description.json', { json: {} })
    assert(codes(runs[true]).includes('JSON_KEY_REQUIRED'))
    assert(!codes(runs[false]).includes('JSON_KEY_REQUIRED'))
  })

  await t.step('events.tsv columns are not checked', async () => {
    const runs = await applyWithAndWithoutContent('/sub-01/func/sub-01_task-x_events.tsv', {
      columns: { onset: ['2', '1'], duration: ['1', '1'] },
    })
    assert(codes(runs[true]).includes('EVENT_ONSET_ORDER'))
    assert(!codes(runs[false]).includes('EVENT_ONSET_ORDER'))
  })

  await t.step('sidecar fields are checked', async () => {
    const runs = await applyWithAndWithoutContent('/sub-01/func/sub-01_task-x_bold.nii.gz', {
      sidecar: {},
    })
    for (const issues of [runs[true], runs[false]]) {
      assertEquals(issues.get({ code: 'SIDECAR_KEY_REQUIRED', subCode: 'TaskName' }).length, 1)
    }
  })

  await t.step('checks on associations are evaluated', async () => {
    const runs = await applyWithAndWithoutContent('/sub-01/dwi/sub-01_dwi.nii.gz', {})
    for (const issues of [runs[true], runs[false]]) {
      assert(codes(issues).includes('DWI_MISSING_BVEC'))
    }
  })
})

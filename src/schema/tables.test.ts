// @ts-nocheck
import { assertEquals } from '@std/assert'
import { loadSchema } from '../setup/loadSchema.ts'
import {
  evalAdditionalColumns,
  evalColumns,
  evalIndexColumns,
  evalInitialColumns,
} from './tables.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'

const schemaDefs = {
  rules: {
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
          additional_columns: 'not_allowed',
        },
      },
    },
  },
}

Deno.test('tables eval* tests', async (t) => {
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
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Scans
    evalColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE_NONREQUIRED' }).length,
      1,
    )
  })

  await t.step('check formatless column', () => {
    const context = {
      path: '/sub-01/sub-01_something.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        onset: ['1', '2', 'not a number'],
      },
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE' }).length, 1)
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
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.size, 0)
  })

  await t.step('verify column ordering', () => {
    const context = {
      path: '/sub-01/sub-01_scans.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        onset: ['1900-01-01:00:00'],
      },
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Scans
    evalInitialColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_COLUMN_MISSING' }).length,
      1,
    )
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_COLUMN_ORDER_INCORRECT' }).length,
      0,
    )

    context.columns['filename'] = ['func/sub-01_task-rest_bold.nii.gz']
    evalInitialColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_COLUMN_ORDER_INCORRECT' }).length,
      1,
    )
  })

  await t.step('verify column index', () => {
    const context = {
      path: '/sub-01/sub-01_scans.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        onset: ['1900-01-01:00:00', '1900-01-01:00:00'],
      },
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Scans
    evalIndexColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_COLUMN_MISSING' }).length,
      1,
    )
    context.columns['filename'] = [
      'func/sub-01_task-rest_bold.nii.gz',
      'func/sub-01_task-rest_bold.nii.gz',
    ]
    evalIndexColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_INDEX_VALUE_NOT_UNIQUE' }).length,
      1,
    )
  })

  await t.step('verify not allowed additional columns', () => {
    const context = {
      path: '/sub-01/sub-01_scans.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: {
        onset: ['1', '2', 'n/a'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
      },
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalAdditionalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.size, 0)

    context.columns['extra'] = [1, 2, 3]
    evalAdditionalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_ADDITIONAL_COLUMNS_NOT_ALLOWED' }).length,
      1,
    )
  })
  await t.step('verify allowed and allowed_if_defined additional columns', () => {
    const context = {
      path: '/sub-01/sub-01_scans.tsv',
      extension: '.tsv',
      sidecar: { 'extra': { 'description': 'a fun and whimsical extra column' } },
      columns: {
        onset: ['1', '2', 'n/a'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
        extra: [1, 2, 3],
      },
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    rule.additional_columns = 'allowed_if_defined'
    evalAdditionalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.size, 0)

    context['sidecar'] = {}
    evalAdditionalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_ADDITIONAL_COLUMNS_MUST_DEFINE' }).length,
      1,
    )

    rule.additional_columns = 'allowed'
    evalAdditionalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_ADDITIONAL_COLUMNS_UNDEFINED' }).length,
      1,
    )
  })
})

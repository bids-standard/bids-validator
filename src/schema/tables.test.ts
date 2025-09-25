// @ts-nocheck
import { assertEquals } from '@std/assert'
import { loadSchema } from '../setup/loadSchema.ts'
import {
  evalColumns,
  evalIndexColumns,
  evalInitialColumns,
} from './tables.ts'
import { ColumnsMap } from '../types/columns.ts'
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
        Participants: {
          selectors: ['path == "/participants.tsv"'],
          initial_columns: ['participant_id'],
          columns: {
            participant_id: 'required',
            age: 'recommended',
            sex: 'recommended',
            strain_rrid: 'recommended',
          },
          index_columns: ['participant_id'],
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
      columns: new ColumnsMap(Object.entries({
        filename: ['func/sub-01_task-rest_bold.nii.gz'],
        acq_time: ['1900-01-01T00:00:78'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Scans
    evalColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Scans')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE' }).length,
      1,
    )
  })

  await t.step('check formatless column', () => {
    const context = {
      path: '/sub-01/sub-01_something.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: new ColumnsMap(Object.entries({
        onset: ['1', '2', 'not a number'],
      })),
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
      columns: new ColumnsMap(Object.entries({
        onset: ['1', '2', 'n/a'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.size, 0)
  })

  await t.step('verify column override behavior', () => {
    const context = {
      path: '/participants.tsv',
      extension: '.tsv',
      sidecar: {
        participant_id: {
          Description: 'A participant identifier',
          Format: 'string',
        },
        age: {
          Description: 'Age in weeks',
          Format: 'number',
        },
        sex: {
          Description: 'Phenotypic sex',
          Format: 'string',
          Levels: {
            'F': { Description: 'Female' },
            'M': { Description: 'Male' },
            'O': { Description: 'Other' },
          },
        },
        strain_rrid: {
          Description: 'Invalid override',
          Format: 'integer',
        },
      },
      sidecarKeyOrigin: {
        participant_id: '/participants.json',
        age: '/participants.json',
        sex: '/participants.json',
        strain_rrid: '/participants.json',
      },
      columns: new ColumnsMap(Object.entries({
        participant_id: ['sub-01', 'sub-02', 'sub-03'],
        age: ['10', '20', '30'],
        sex: ['M', 'F', 'f'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Participants
    evalColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Participants')

    // participant_id column definition is compatible with schema
    // age and sex may be overridden
    // strain_rrid can't be redefined to numeric
    let issues = context.dataset.issues.get({ code: 'TSV_COLUMN_TYPE_REDEFINED' })
    assertEquals(issues.length, 1)
    assertEquals(issues[0].subCode, 'strain_rrid')
    assertEquals(issues[0].issueMessage, 'Format "integer" must be rrid')

    // Overriding the default sex definition uses the provided values
    // Values in the default definition may raise issues
    issues = context.dataset.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE' })
    assertEquals(issues.length, 1)
    assertEquals(issues[0].subCode, 'sex')
    assertEquals(issues[0].line, 4)
    assertEquals(issues[0].issueMessage, "'f'")
  })

  await t.step('verify pseudo-age deprecation', () => {
    const context = {
      path: '/participants.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: new ColumnsMap(Object.entries({
        participant_id: ['sub-01', 'sub-02', 'sub-03'],
        age: ['10', '89+', '89+'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Participants
    evalColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Participants')

    // age gets a warning
    let issues = context.dataset.issues.get({ code: 'TSV_PSEUDO_AGE_DEPRECATED' })
    assertEquals(issues.length, 1)
  })

  await t.step('validate additional column with sidecar', () => {
    const context = {
      path: '/participants.tsv',
      extension: '.tsv',
      sidecar: {
        myAge: {
          Description: 'Age in weeks',
          Format: 'number',
        },
        mySex: {
          Description: 'Phenotypic sex',
          Format: 'string',
          Levels: {
            'F': { Description: 'Female' },
            'M': { Description: 'Male' },
            'O': { Description: 'Other' },
          },
        },
      },
      sidecarKeyOrigin: {
        myAge: '/participants.json',
        mySex: '/participants.json',
      },
      columns: new ColumnsMap(Object.entries({
        participant_id: ['sub-01', 'sub-02', 'sub-03'],
        myAge: ['10', '20', '89+'],
        mySex: ['M', 'F', 'O'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Participants
    evalColumns(rule, context, schema, 'rules.tabular_data.modality_agnostic.Participants')

    // myAge does not get the pseudo-age warning
    // mySex doesn't raise issues
    const issues = context.dataset.issues.get({ code: 'TSV_VALUE_INCORRECT_TYPE' })
    assertEquals(issues.length, 1)
    assertEquals(issues[0].subCode, 'myAge')
    assertEquals(issues[0].line, 4)
    assertEquals(issues[0].issueMessage, "'89+'")
  })

  await t.step('verify column ordering', () => {
    const context = {
      path: '/sub-01/sub-01_scans.tsv',
      extension: '.tsv',
      sidecar: {},
      columns: new ColumnsMap(Object.entries({
        onset: ['1900-01-01:00:00'],
      })),
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
      columns: new ColumnsMap(Object.entries({
        onset: ['1900-01-01:00:00', '1900-01-01:00:00'],
        filename: ['func/sub-01_task-rest_bold.nii.gz', 'func/sub-01_task-rest_bold.nii.gz'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.modality_agnostic.Scans
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
      columns: new ColumnsMap(Object.entries({
        onset: ['1', '2', 'n/a'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.size, 0)

    context.columns['extra'] = [1, 2, 3]
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
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
      columns: new ColumnsMap(Object.entries({
        onset: ['1', '2', 'n/a'],
        strain_rrid: ['RRID:SCR_012345', 'RRID:SCR_012345', 'n/a'],
        extra: [1, 2, 3],
      })),
      dataset: { issues: new DatasetIssues() },
    }
    const rule = schemaDefs.rules.tabular_data.made_up.MadeUp
    rule.additional_columns = 'allowed_if_defined'
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(context.dataset.issues.size, 0)

    context['sidecar'] = {}
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_ADDITIONAL_COLUMNS_MUST_DEFINE' }).length,
      1,
    )

    rule.additional_columns = 'allowed'
    evalColumns(rule, context, schema, 'rules.tabular_data.made_up.MadeUp')
    assertEquals(
      context.dataset.issues.get({ code: 'TSV_ADDITIONAL_COLUMNS_UNDEFINED' }).length,
      1,
    )
  })
})

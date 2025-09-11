import { assertEquals, assertObjectMatch } from '@std/assert'
import type { BIDSFile, FileTree } from '../../types/filetree.ts'
import type { GenericRule, GenericSchema } from '../../types/schema.ts'
import { loadHeader } from '../../files/nifti.ts'
import { BIDSFileDeno } from '../../files/deno.ts'
import { BIDSContext, BIDSContextDataset } from '../../schema/context.ts'
import { loadSchema } from '../../setup/loadSchema.ts'
import { evalRuleChecks } from '../../schema/applyRules.ts'
// import { applyRules } from '../../schema/applyRules.ts'
import type { Context, NiftiHeader } from '@bids/schema/context'
import type { Schema } from '@bids/schema/metaschema'

import { expressionFunctions } from '../../schema/expressionLanguage.ts'

function prepContext(header: NiftiHeader, dir: string, pedir: string): BIDSContext {
  const fullContext = {
    dataset: new BIDSContextDataset({}),
    nifti_header: header,
    entities: { direction: dir },
    sidecar: { PhaseEncodingDirection: pedir },
  } as unknown as BIDSContext
  Object.assign(fullContext, expressionFunctions)
  return fullContext
}

Deno.test('Test NIFTI-specific rules', async (t) => {
  const RAS = await loadHeader(new BIDSFileDeno('', 'tests/data/RAS.nii.gz'))
  const SPL = await loadHeader(new BIDSFileDeno('', 'tests/data/SPL.nii.gz'))
  const AIR = await loadHeader(new BIDSFileDeno('', 'tests/data/AIR.nii.gz'))

  const schema = await loadSchema() as Schema
  const NiftiPEDir = schema.rules?.checks?.nifti?.NiftiPEDir as GenericRule

  await t.step('Test reading NIfTI axis codes', async () => {
    assertEquals(RAS.axis_codes, ['R', 'A', 'S'])
    assertEquals(SPL.axis_codes, ['S', 'P', 'L'])
    assertEquals(AIR.axis_codes, ['A', 'I', 'R'])
  })

  await t.step('Test rules.checks.nifti.NiftiPEDir', async () => {
    const schemaPath = 'rules.checks.nifti.NiftiPEDir'

    let context = prepContext(RAS, 'PA', 'j')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(RAS, 'AP', 'j-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(RAS, 'LR', 'i')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(RAS, 'RL', 'i-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(RAS, 'IS', 'k')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(RAS, 'SI', 'k-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)

    // Common flips
    context = prepContext(RAS, 'AP', 'j')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)
    context = prepContext(RAS, 'PA', 'j-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)
    context = prepContext(RAS, 'RL', 'i')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)
    context = prepContext(RAS, 'LR', 'i-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)

    // Wrong axes
    context = prepContext(RAS, 'PA', 'i')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)
    context = prepContext(RAS, 'AP', 'k')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)
    context = prepContext(RAS, 'LR', 'j')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)
    context = prepContext(RAS, 'RL', 'k-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({ code: 'NIFTI_PE_DIRECTION_CONSISTENCY' }).length, 1)

    // A couple checks on SPL and AIR
    context = prepContext(SPL, 'IS', 'i')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(SPL, 'AP', 'j')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(SPL, 'RL', 'k')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)

    context = prepContext(AIR, 'IS', 'j-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(AIR, 'AP', 'i-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
    context = prepContext(AIR, 'RL', 'k-')
    evalRuleChecks(NiftiPEDir, context, {} as GenericSchema, schemaPath)
    assertEquals(context.dataset.issues.get({}).length, 0)
  })
})

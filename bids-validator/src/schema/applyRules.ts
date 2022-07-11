import { Schema } from '../types/schema.ts'
import { BIDSContext } from './context.ts'

/**
 * Given a schema and context, evaluate which rules match and test them
 * @param schema
 * @param context
 */
export function applyRules(schema: Schema, context: BIDSContext) {
  for (const key in schema) {
    if (!(schema[key].constructor === Object)) {
      continue
    }
    if ('selectors' in schema[key]) {
      evalRule(schema[key], context)
    } else if (schema[key].constructor === Object) {
      applyRules(schema[key], context)
    }
  }
}

const evalConstructor = (src: string): Function =>
  new Function('context', `with (context) { return ${src} }`)
const safeHas = () => true
const safeGet = (target: any, prop: any) =>
  prop === Symbol.unscopables ? undefined : target[prop]

export function evalCheck(src: string, context: Record<string, any>) {
  const test = evalConstructor(src)
  const safeContext = new Proxy(context, { has: safeHas, get: safeGet })
  try {
    return test(safeContext)
  } catch (error) {
    return false
  }
}

const evalMap = {
  checks: evalRuleChecks,
  columns: evalColumns,
  additional_columns: evalAdditionalColumns,
  initial_columns: evalInitialColumns,
  fields: evalJsonCheck,
}

function evalRule(rule, context) {
  if (!mapEvalCheck(rule.selectors, context)) {
    return
  }
  Object.keys(rule)
    .filter((key) => key in evalMap)
    .map((key) => {
      evalMap[key](rule, context)
    })
}

function mapEvalCheck(statements, context): boolean {
  return statements.every((x) => evalCheck(x, context))
}

function evalRuleChecks(rule, context): boolean {
  if (!mapEvalCheck(rule.checks, context)) {
    context.issues.add({
      key: 'CHECK_ERROR',
      reason: JSON.stringify(rule),
      files: [context.file],
    })
  }
  return true
}

function evalColumns(rule, context): void {
  const headers = Object.keys(context.columns)
  for (const [ruleHeader, requirement] of Object.entries(rule.columns)) {
    if (!ruleHeader in headers) {
      context.issues.add({
        key: 'TSV_ERROR',
        reason: JSON.stringify(rule),
        files: [context.file],
      })
    }
  }
}

function evalInitialColumns(rule, context): void {
  rule.initial_columns.map((ruleHeader, ruleIndex) => {
    const contextIndex = headers.findIndex(ruleHeader)
    if (contextIndex === -1) {
      context.issues.add('TSV_ERROR', JSON.stringify(rule))
    } else if (ruleIndex !== contextIndex) {
      context.issues.add('TSV_ERROR', JSON.stringify(rule))
    }
  })
}

function evalAdditionalColumns(rule, context): void {
  // hard coding allowed here feels bad
  if (!rule.additional_columns === 'allowed') {
    const extraCols = headers.filter((header) => !header in rule.columns)
    context.issues.add('TSV_ERROR', JSON.stringify(rule))
  }
}

function evalJsonCheck(rule, context): void {
  for (const [key, requirement] of Object.entries(rule.fields)) {
    if (!(key in context.sidecar)) {
      context.issues.add('JSON_ERROR', JSON.stringify(rule))
    }
  }
}

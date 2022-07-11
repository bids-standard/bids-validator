import { GenericRule, GenericSchema } from '../types/schema.ts'
import { BIDSContext } from './context.ts'

/**
 * Given a schema and context, evaluate which rules match and test them.
 * Recursively descend into schema object and iterate over each levels keys.
 * If we find a child of the object that isn't an Object ignore it, this will
 * be things that show up in meta and objects directories. If an an object
 * has a selectors key we know that this is an actual rule that we know how
 * to evaluate. Finally if what we have is an Object recurse on it to see if
 * its children have any rules.
 * @param schema
 * @param context
 */
export function applyRules(schema: GenericSchema, context: BIDSContext) {
  for (const key in schema) {
    if (!(schema[key].constructor === Object)) {
      continue
    }
    if ('selectors' in schema[key]) {
      evalRule(schema[key] as GenericRule, context)
    } else if (schema[key].constructor === Object) {
      applyRules(schema[key] as GenericSchema, context)
    }
  }
}

const evalConstructor = (src: string): Function =>
  new Function('context', `with (context) { return ${src} }`)
const safeHas = () => true
const safeGet = (target: any, prop: any) =>
  prop === Symbol.unscopables ? undefined : target[prop]

export function evalCheck(src: string, context: BIDSContext) {
  const test = evalConstructor(src)
  const safeContext = new Proxy(context, { has: safeHas, get: safeGet })
  try {
    return test(safeContext)
  } catch (error) {
    return false
  }
}

/**
 * Different keys in a rule have different interpretations.
 * We associate theys keys from a rule object to a function adds an
 * issue to the context if the rule evaluation fails.
 */
const evalMap: Record<
  keyof Omit<GenericRule, 'selectors'>,
  (rule: GenericRule, context: BIDSContext) => boolean | void
> = {
  checks: evalRuleChecks,
  columns: evalColumns,
  additional_columns: evalAdditionalColumns,
  initial_columns: evalInitialColumns,
  fields: evalJsonCheck,
}

/**
 * Entrypoint for evaluating a individual rule.
 * We see if every selector applies to this context,
 * Then we attempt to interpret every other key in the rule
 * obect.
 */
function evalRule(rule: GenericRule, context: BIDSContext) {
  if (!mapEvalCheck(rule.selectors, context)) {
    return
  }
  Object.keys(rule)
    .filter((key) => key in evalMap)
    .map((key) => {
      // @ts-expect-error
      evalMap[key](rule, context)
    })
}

function mapEvalCheck(statements: string[], context: BIDSContext): boolean {
  return statements.every((x) => evalCheck(x, context))
}

/**
 * Classic rules interpreted like selectors. Examples in specification:
 * schema/rules/checks/*
 */
function evalRuleChecks(rule: GenericRule, context: BIDSContext): boolean {
  if (!mapEvalCheck(rule.checks, context)) {
    context.issues.add({
      key: 'CHECK_ERROR',
      reason: JSON.stringify(rule),
      files: [context.file],
    })
  }
  return true
}

/**
 * Columns in schema rules are assertions about the requirement level of what
 * headers should be present in a tsv file. Examples in specification:
 * schema/rules/tabular_data/*
 */
function evalColumns(rule: GenericRule, context: BIDSContext): void {
  const headers = Object.keys(context.columns)
  for (const [ruleHeader, requirement] of Object.entries(rule.columns)) {
    if (!(ruleHeader in headers)) {
      context.issues.add({
        key: 'TSV_ERROR',
        reason: JSON.stringify(rule),
        files: [context.file],
      })
    }
  }
}

/**
 * A small subset of tsv schema rules enforce a specific order of columns.
 * No error is currently provided by the rule itself.
 */
function evalInitialColumns(rule: GenericRule, context: BIDSContext): void {
  const headers = Object.keys(context.columns)
  rule.initial_columns.map((ruleHeader: string, ruleIndex: number) => {
    const contextIndex = headers.findIndex((x) => x === ruleHeader)
    if (contextIndex === -1) {
      context.issues.add({
        key: 'TSV_ERROR',
        reason: JSON.stringify(rule),
        files: [context.file],
      })
    } else if (ruleIndex !== contextIndex) {
      context.issues.add({
        key: 'TSV_ERROR',
        reason: JSON.stringify(rule),
        files: [context.file],
      })
    }
  })
}

function evalAdditionalColumns(rule: GenericRule, context: BIDSContext): void {
  const headers = Object.keys(context.columns)
  // hard coding allowed here feels bad
  if (!(rule.additional_columns === 'allowed')) {
    const extraCols = headers.filter((header) => !(header in rule.columns))
    context.issues.add({
      key: 'TSV_ERROR',
      reason: JSON.stringify(rule),
      files: [context.file],
    })
  }
}

/**
 * For evaluating field requirements and values that should exist in a json
 * sidecar for a file. Will need to implement an additional check/error for
 * `prohibitied` fields. Examples in specification:
 * schema/rules/sidecars/*
 */
function evalJsonCheck(rule: GenericRule, context: BIDSContext): void {
  for (const [key, requirement] of Object.entries(rule.fields)) {
    if (!(key in context.sidecar)) {
      context.issues.add({ key: 'JSON_ERROR', reason: JSON.stringify(rule) })
    }
  }
}

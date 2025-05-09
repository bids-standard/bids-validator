import type { GenericRule, GenericSchema, SchemaFields, SchemaTypeLike } from '../types/schema.ts'
import type { Severity } from '../types/issues.ts'
import type { BIDSContext } from './context.ts'
import { expressionFunctions } from './expressionLanguage.ts'
import { logger } from '../utils/logger.ts'
import { memoize } from '../utils/memoize.ts'
import { compile } from '../validators/json.ts'
import type { DefinedError } from '@ajv'
import {
  evalAdditionalColumns,
  evalColumns,
  evalIndexColumns,
  evalInitialColumns,
} from './tables.ts'

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
export function applyRules(
  schema: GenericSchema,
  context: BIDSContext,
  rootSchema?: GenericSchema,
  schemaPath?: string,
) {
  if (!rootSchema) {
    rootSchema = schema
  }
  /* Normal run of validation starts at schema.json root, but some tests will pass
     in truncated schemas. Only set origin of rules to rules object if we see it.
   */
  if (schemaPath === undefined) {
    if (Object.hasOwn(schema, 'rules')) {
      schemaPath = 'rules'
      // @ts-expect-error
      schema = schema.rules
    } else {
      schemaPath = ''
    }
  }
  Object.assign(context, expressionFunctions)
  // @ts-expect-error
  context.exists.bind(context)
  for (const key in schema) {
    if (!(schema[key].constructor === Object)) {
      continue
    }
    if ('selectors' in schema[key]) {
      evalRule(
        schema[key] as GenericRule,
        context,
        rootSchema,
        `${schemaPath}.${key}`,
      )
    } else if (schema[key].constructor === Object) {
      applyRules(
        schema[key] as GenericSchema,
        context,
        rootSchema,
        `${schemaPath}.${key}`,
      )
    }
  }
  return Promise.resolve()
}

export const evalConstructor = (src: string): Function =>
  new Function('context', `with (context) { return ${src.replace(/\\/g, '\\\\')} }`)
const safeHas = () => true
const safeGet = (target: any, prop: any) => prop === Symbol.unscopables ? undefined : target[prop]

const memoizedEvalConstructor = memoize(evalConstructor)

export function evalCheck(src: string, context: BIDSContext) {
  const test = memoizedEvalConstructor(src)
  const safeContext = new Proxy(context, { has: safeHas, get: safeGet })
  try {
    return test(safeContext)
  } catch (error) {
    logger.debug(error)
    return null
  }
}

/**
 * Different keys in a rule have different interpretations.
 * We associate theys keys from a rule object to a function adds an
 * issue to the context if the rule evaluation fails.
 */
// @ts-expect-error
const evalMap: Record<
  keyof GenericRule,
  (
    rule: GenericRule,
    context: BIDSContext,
    schema: GenericSchema,
    schemaPath: string,
  ) => boolean | void
> = {
  checks: evalRuleChecks,
  columns: evalColumns,
  additional_columns: evalAdditionalColumns,
  initial_columns: evalInitialColumns,
  index_columns: evalIndexColumns,
  fields: evalJsonCheck,
}

/**
 * Entrypoint for evaluating a individual rule.
 * We see if every selector applies to this context,
 * Then we attempt to interpret every other key in the rule
 * object.
 */
function evalRule(
  rule: GenericRule,
  context: BIDSContext,
  schema: GenericSchema,
  schemaPath: string,
) {
  if (rule.selectors && !mapEvalCheck(rule.selectors, context)) {
    return
  }
  Object.keys(rule)
    .filter((key) => key in evalMap)
    .map((key) => {
      // @ts-expect-error
      evalMap[key](rule, context, schema, schemaPath)
    })
}

function mapEvalCheck(statements: string[], context: BIDSContext): boolean {
  return statements.every((x) => evalCheck(x, context))
}

/**
 * Classic rules interpreted like selectors. Examples in specification:
 * schema/rules/checks/*
 */
function evalRuleChecks(
  rule: GenericRule,
  context: BIDSContext,
  schema: GenericSchema,
  schemaPath: string,
): boolean {
  if (rule.checks && !mapEvalCheck(rule.checks, context)) {
    if (rule.issue?.code && rule.issue?.message) {
      context.dataset.issues.add({
        code: rule.issue.code,
        location: context.path,
        rule: schemaPath,
        severity: rule.issue.level as Severity,
      }, rule.issue.message)
    } else {
      context.dataset.issues.add(
        { code: 'CHECK_ERROR', location: context.path, rule: schemaPath },
      )
    }
  }
  return true
}

/**
 * For evaluating field requirements and values that should exist in a json
 * sidecar for a file. Will need to implement an additional check/error for
 * `prohibitied` fields. Examples in specification:
 * schema/rules/sidecars/*
 */
function evalJsonCheck(
  rule: GenericRule,
  context: BIDSContext,
  schema: GenericSchema,
  schemaPath: string,
): void {
  const sidecarRule = schemaPath.match(/rules\.sidecar/)
  // Sidecar rules apply specifically to data files, as JSON files cannot have sidecars
  // Count on other JSON rules to use selectors to match the correct files
  // Text files at the root do not have sidecars. We might want a cleaner
  // or more schematic way to identify them in the future.
  if (sidecarRule && (['.json', '', '.md', '.txt', '.rst', '.cff'].includes(context.extension))) return

  const json: Record<string, any> = sidecarRule ? context.sidecar : context.json
  for (const [key, requirement] of Object.entries(rule.fields)) {
    // @ts-expect-error
    const metadataDef = schema.objects.metadata[key]
    const keyName: string = metadataDef.name
    const value = json[keyName]
    const issueMessage = `Field description: ${metadataDef.description}`

    if (value === undefined) {
      const severity = getFieldSeverity(requirement, context)
      if (severity && severity !== 'ignore') {
        if (requirement.issue?.code && requirement.issue?.message) {
          context.dataset.issues.add({
            code: requirement.issue.code,
            subCode: keyName,
            location: context.path,
            severity,
            rule: schemaPath,
            issueMessage,
          }, requirement.issue.message)
        } else {
          const keyType = sidecarRule ? 'SIDECAR_KEY' : 'JSON_KEY'
          const level = severity === 'error' ? 'REQUIRED' : 'RECOMMENDED'
          context.dataset.issues.add({
            code: `${keyType}_${level}`,
            subCode: keyName,
            location: context.path,
            severity,
            rule: schemaPath,
            issueMessage,
          })
        }
      }

      /* Regardless of if key is required/recommended/optional, we do no
       * further valdiation if it is not present in sidecar.
       */
      continue
    }

    if (sidecarRule && !(keyName in context.sidecarKeyOrigin)) {
      logger.warn(
        `sidecarKeyOrigin map failed to initialize for ${context.path} on key ${keyName}. Validation caching not active for this key.`,
      )
    }

    const location = sidecarRule ? (context.sidecarKeyOrigin[keyName] ?? '') : context.path
    const affects = sidecarRule ? [context.path] : undefined

    const keyAddress = `${location}:${keyName}`

    if (sidecarRule && context.dataset.sidecarKeyValidated.has(keyAddress)) {
      continue
    }

    const validate = compile(metadataDef)
    if (!validate(value)) {
      for (const err of validate.errors as DefinedError[]) {
        context.dataset.issues.add({
          code: 'JSON_SCHEMA_VALIDATION_ERROR',
          subCode: keyName,
          issueMessage: `${err['message']}\n\n${issueMessage}`,
          rule: schemaPath,
          location,
          affects,
        })
      }
    }
    if (sidecarRule && location) {
      context.dataset.sidecarKeyValidated.add(keyAddress)
    }
  }
}

/**
 * JSON Field checks have conditions where their requirement levels can
 * change based on some other field. This function resolves the severity
 * of a JsonCheckFailure depending on how the checks level object is shaped.
 */
function getFieldSeverity(
  requirement: string | SchemaFields,
  context: BIDSContext,
): Severity {
  // Does this conversion hold for other parts of the schema or just json checks?
  const levelToSeverity: Record<string, Severity> = {
    recommended: 'warning',
    required: 'error',
    optional: 'ignore',
    prohibited: 'ignore',
  }
  let severity: Severity = 'ignore'

  if (typeof requirement === 'string' && requirement in levelToSeverity) {
    severity = levelToSeverity[requirement]
  } else if (typeof requirement === 'object' && requirement.level) {
    severity = levelToSeverity[requirement.level]
    const addendumRegex = /(required|recommended) if \`(\w+)\` is \`(\w+)\`/
    if (requirement.level_addendum) {
      const match = addendumRegex.exec(requirement.level_addendum)
      if (match && match.length === 4) {
        const [_, addendumLevel, key, value] = match
        if (key in context.sidecar && context.sidecar[key] === value) {
          severity = levelToSeverity[addendumLevel]
        }
      }
    }
  }
  return severity
}

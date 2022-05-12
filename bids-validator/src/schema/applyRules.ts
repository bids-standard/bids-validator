import { SEP } from '../deps/path.ts'
import { Issue, ignore } from '../types/issues.ts'
import { Schema } from '../types/schema.ts'
import { BIDSContext } from './context.ts'

/**
 * Given a schema and context, evaluate which rules match and test them
 * @param schema
 * @param context
 */
export function applyRules(schema: Schema, context: BIDSContext): Issue[] {
  const issues: Issue[] = []
  if (!isTopLevel(schema, context)) {
    issues.push(...checkDatatypes(schema, context))
  }
  return issues
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
    console.error(error)
  }
}

export function checkDatatypes(schema: Schema, context: BIDSContext): Issue[] {
  const issues: Issue[] = []
  delete schema.rules.datatypes.derivatives
  const datatypes = Object.values(schema.rules.datatypes);
  for (const rules of datatypes) {
    for (const key of Object.keys(rules)) {
      issues.push(...checkDatatype(rules[key], schema, context));
      if (context.datatype) {
        break;
      }
      // we may want to save key into context, gives exact rule name matched
    }
    if (context.datatype) {
      break;
    }
  }
  return issues
}

function checkDatatype(rule, schema: Schema, context: BIDSContext) {
  const issues: Issue[] = [];
  const { suffix, extension, entities } = context;
  if (rule.suffixies && !rule.suffixes.includes(suffix)) {
    return issues;
  }

  if (rule.extensions && !rule.extensions.includes(extension)) {
    return issues;
  }

  context.datatype = rule.datatypes[0];

  // context entities are key-value pairs from filename.
  const fileEntities = Object.keys(entities)

  // we need to convert schema centric name to what shows up in filenames
  const ruleEntities = Object.keys(rule.entities).map(key => lookupEntityLiteral(key, schema))
  const ruleEntitiesRequired = Object.entries(rule.entities).filter(([_, v]) => v === 'required').map(([k, _]) => lookupEntityLiteral(k, schema))

  const missingRequired = ruleEntitiesRequired.filter(required => !fileEntities.includes(required))

  const entityNotInRule = fileEntities.filter(fileEntity => !ruleEntities.includes(fileEntity))

  if (missingRequired.length) {
    issues.push(tempError("missingRequired", missingRequired.join(', ') + context.file.path))
  }

  if (entityNotInRule.length) {
    issues.push(tempError("entityNotInRule", entityNotInRule.join(', ')))
  }
  return issues
}

function lookupEntityLiteral(name: string, schema: Schema) {
  const entityObj = schema.objects.entities[name]
  if (entityObj && entityObj['entity']) {
    return entityObj['entity']
  } else {
    // if this happens theres an issue with the schema?
    return ''
  }
}

function tempError(key: string, reason: string): Issue {
  return {
    severity: "error",
    key: key,
    code: 0,
    reason: reason,
    files: [],
    additionalFileCount: 0,
    helpUrl: "http://example.com"
  }
}

function isTopLevel(schema: Schema, context: BIDSContext) {
  if (context.file.path.split(SEP).length !== 2) {
    return false
  }

  const top_level_files = schema.rules.top_level_files
  const name = context.file.name.split(".")[0]
  return top_level_files.hasOwnProperty(name)
}

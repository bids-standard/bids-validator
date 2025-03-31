/*
 * filenameIdentify.ts attempts to determine which schema rules from
 * `schema.rules.files` might apply to a given file context by looking at the
 * files suffix then its location in the directory hierarchy, and finally at
 * its extensions and entities. Ideally we end up with a single rule to
 * validate against. We try to take as broad an approach to finding a single
 * file rule as possible to generate the most possible errors for incorrectly
 * named files. Historically a regex was applied that was pass/fail with
 * little in the way of feed back. This way we can say hey you got the suffix
 * correct, but the directory is slightly off, or some entities are missing,
 * or too many are there for this rule. All while being able to point at an
 * object in the schema for reference.
 */
// @ts-nocheck
import { globToRegExp, SEPARATOR_PATTERN } from '@std/path'
import type { GenericSchema, Schema } from '../types/schema.ts'
import type { BIDSContext } from '../schema/context.ts'
import type { lookupModality } from '../schema/modalities.ts'
import type { CheckFunction } from '../types/check.ts'
import { lookupEntityLiteral } from './filenameValidate.ts'

const CHECKS: CheckFunction[] = [
  datatypeFromDirectory,
  findRuleMatches,
  hasMatch,
  cleanContext,
]

const DIR_CHECKS: CheckFunction[] = [
  findDirRuleMatches,
  hasMatch,
  cleanContext,
]

export async function filenameIdentify(schema, context) {
  const checks = context?.directory ? DIR_CHECKS : CHECKS
  for (const check of checks) {
    await check(schema as unknown as GenericSchema, context)
  }
}

export async function findDirRuleMatches(schema, context) {
  const datasetType = context.dataset.dataset_description?.DatasetType || 'raw'
  const schemaPath = `rules.directories.${datasetType}`
  const directoryRule = schema[schemaPath]
  const schemaObjects = schema['objects']
  const schemaEntities = schema['objects.entities']
  loop: for (const key of Object.keys(directoryRule)) {
    const path = `${schemaPath}.${key}`
    const node = directoryRule[key]
    if ('name' in node) {
      if (node.name === context.file.name.replaceAll('/', '')) {
        context.filenameRules.push(path)
        break
      }
    }
    if ('entity' in node) {
      let entityDef = schemaEntities[node.entity]
      if (
        entityDef && 'name' in entityDef && context.file.name.startsWith(`${entityDef['name']}-`)
      ) {
        context.filenameRules.push(path)
        break
      }
    }
    if ('value' in node) {
      // kludge, entries in schema.objects are plural, value specified as singular
      // will fail for modalities
      for (const valueObj of Object.keys(schemaObjects[`${node.value}s`])) {
        if (valueObj === context.file.name.replaceAll('/', '')) {
          context.filenameRules.push(path)
          break loop
        }
      }
    }
  }
  return Promise.resolve()
}
function findRuleMatches(schema, context) {
  const schemaPath = 'rules.files'
  Object.keys(schema[schemaPath]).map((key) => {
    if (
      key == 'deriv' &&
      context.dataset.dataset_description.DatasetType != 'derivative'
    ) {
      return
    }
    const path = `${schemaPath}.${key}`
    _findRuleMatches(schema[path], path, context)
  })
  return Promise.resolve()
}

/* Schema rules specifying valid filenames follow a variety of patterns.
 * 'path', 'stem' or 'suffixies' contain the most unique identifying
 * information for a rule. We don't know what kind of filename the context is,
 * so if one of these three match the respective value in the context lets
 * assume that this schema rule is applicable to this file.
 */
export function _findRuleMatches(node, path, context) {
  if (
    (`/${node.path}` === context.path) ||
    (node.stem && matchStemRule(node, context)) ||
    ('suffixes' in node && node.suffixes.includes(context.suffix))
  ) {
    context.filenameRules.push(path)
    return
  }
  if (
    !('path' in node || 'stem' in node || 'suffixes' in node) &&
    typeof node === 'object'
  ) {
    Object.keys(node).map((key) => {
      _findRuleMatches(node[key], `${path}.${key}`, context)
    })
  }
}

function matchStemRule(node, context): boolean {
  if (!context.file.name.split('.')[0].match(globToRegExp(node.stem))) {
    return false
  }
  if (node.datatypes) {
    return node.datatypes.includes(context.datatype)
  }
  return true
}

export async function datatypeFromDirectory(schema, context) {
  const subEntity = schema.objects.entities.subject.name
  const sesEntity = schema.objects.entities.session.name
  const parts = context.file.path.split(SEPARATOR_PATTERN)
  const datatypeIndex = parts.length - 2
  if (datatypeIndex < 1) {
    return Promise.resolve()
  }
  const dirDatatype = parts[datatypeIndex]
  if (dirDatatype === 'phenotype') {
    // Phenotype is a pseudo-datatype for now.
    context.datatype = dirDatatype
    return Promise.resolve()
  }
  for (const key in schema.rules.modalities) {
    if (schema.rules.modalities[key].datatypes.includes(dirDatatype)) {
      context.modality = key
      context.datatype = dirDatatype
      return Promise.resolve()
    }
  }
}

export function hasMatch(schema, context) {
  if (
    context.filenameRules.length === 0 &&
    context.file.path !== '/.bidsignore'
  ) {
    context.dataset.issues.add({
      code: 'NOT_INCLUDED',
      location: context.path,
    })
  }

  /* we have matched multiple rules and a datatype, lets see if we have one
   *   rule with the same datatype, if so just use that one.
   */
  if (context.filenameRules.length > 1) {
    const datatypeMatch = context.filenameRules.filter((rulePath) => {
      if (Array.isArray(schema[rulePath].datatypes)) {
        return schema[rulePath].datatypes.includes(context.datatype)
      } else {
        return false
      }
    })
    if (datatypeMatch.length > 0) {
      context.filenameRules = datatypeMatch
    }
  }

  /* Filtering applicable rules based on datatypes failed, lets see if the
   * entities and extensions are enough to find a single rule to use.
   */
  if (context.filenameRules.length > 1) {
    const entExtMatch = context.filenameRules.filter((rulePath) => {
      return entitiesExtensionsInRule(schema, context, rulePath)
    })
    if (entExtMatch.length > 0) {
      context.filenameRules = entExtMatch
    }
  }

  return Promise.resolve()
}

/* Test if all of a given context's extension and entities are present in a
 * given rule. Only used to see if one rule is more applicable than another
 * after suffix and datatype matches couldn't find only one rule.
 */
function entitiesExtensionsInRule(
  schema: GenericSchema,
  context: BIDSContext,
  path: string,
): boolean {
  const rule = schema[path]
  const fileEntities = Object.keys(context.entities)
  const ruleEntities = rule.entities
    ? Object.keys(rule.entities).map((key) => lookupEntityLiteral(key, schema))
    : []
  const extInRule = !rule.extensions ||
    (rule.extensions && rule.extensions.includes(context.extension))
  const entInRule = !rule.entities ||
    (rule.entities &&
      fileEntities.every((ent) => {
        return ruleEntities.includes(ent)
      }))
  return extInRule && entInRule
}

/* If none of the rules applicable to a filename use entities or what not,
 * lets remove them from the context so we don't trigger any unintended rules
 */
function cleanContext(schema, context) {
  const rules = context.filenameRules.map((path) => schema[path])
  const filenameParts = [
    ['entities', 'entities', {}],
    ['extensions', 'extension', ''],
    ['suffixes', 'suffix', ''],
  ]
  filenameParts.map((part) => {
    if (
      rules.every(
        (rule) => !rule[part[0]] || Object.keys(rule[part[0]]).length === 0,
      )
    ) {
      context[part[1]] = part[2]
    }
  })
}

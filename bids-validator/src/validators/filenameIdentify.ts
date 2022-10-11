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
import { SEP } from '../deps/path.ts'
import { Schema } from '../types/schema.ts'
import { BIDSContext } from '../schema/context.ts'
import { lookupModality } from '../schema/modalities.ts'
import { CheckFunction } from '../types/check.ts'
import { lookupEntityLiteral } from './filenameValidate.ts'

const CHECKS: CheckFunction[] = [
  datatypeFromDirectory,
  findRuleMatches,
  hasMatch,
]

export async function filenameIdentify(schema, context) {
  for (const check of CHECKS) {
    await check(schema as unknown as GenericSchema, context)
  }
  return Promise.resolve()
}

async function findRuleMatches(schema, context) {
  let schemaPath = 'rules.files'
  Object.keys(schema[schemaPath]).map((key) => {
    const path = `${schemaPath}.${key}`
    _findRuleMatches(schema[path], path, context)
  })
  return Promise.resolve()
}

function _findRuleMatches(node, path, context) {
  if (
    ('path' in node && context.file.name.endsWith(node.path)) ||
    ('stem' in node && context.file.name.startsWith(node.stem)) ||
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

async function datatypeFromDirectory(schema, context) {
  const subEntity = schema.objects.entities.subject.name
  const subFormat = schema.objects.formats[subEntity.format]
  const sesEntity = schema.objects.entities.session.name
  const sesFormat = schema.objects.formats[sesEntity.format]
  const parts = context.file.path.split(SEP)
  let datatypeIndex = 2
  if (parts[0] !== '') {
    // we assume paths have leading '/'
  }
  // Ignoring associated data for now
  const subParts = parts[1].split('-')
  if (!(subParts.length === 2 && subParts[0] === subEntity)) {
    // first directory must be subject
  }
  if (parts.length < 3) {
    return Promise.resolve()
  }
  const sesParts = parts[2].split('-')
  if (sesParts.length === 2 && sesParts[0] === sesEntity) {
    datatypeIndex = 3
  }
  let dirDatatype = parts[datatypeIndex]
  for (let key in schema.rules.modalities) {
    if (schema.rules.modalities[key].datatypes.includes(dirDatatype)) {
      context.modality = key
      context.datatype = dirDatatype
      return Promise.resolve()
    }
  }
}

async function hasMatch(schema, context) {
  if (
    context.filenameRules.length === 0 &&
    context.file.path !== '/.bidsignore'
  ) {
    context.issues.addNonSchemaIssue('NOT_INCLUDED', [context.file])
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

  /* Reduction based on datatype failed, lets see if the entities and
   * extensions are enough to find a single rule.
   */
  if (context.filenameRules.length > 1) {
    const entExtMatch = context.filenameRules.filter((rulePath) => {
      return entitiesExtensionsInRule(schema, context, rulePath)
    })
    if (entExtMatch.length > 0) {
      context.filenameRules = [entExtMatch[0]]
    }
  }
  /* If we end up with multiple rules we should generate an error? */

  return Promise.resolve()
}

function entitiesExtensionsInRule(schema, context, path) {
  const rule = schema[path]
  const fileEntities = Object.keys(context.entities)
  const ruleEntities = Object.keys(rule.entities).map((key) =>
    lookupEntityLiteral(key, schema),
  )

  return (
    rule.extensions &&
    rule.extensions.includes(context.extension) &&
    rule.entities &&
    fileEntities.every((ent) => {
      return ruleEntities.includes(ent)
    })
  )
}

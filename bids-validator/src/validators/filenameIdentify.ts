// @ts-nocheck
import { SEP } from '../deps/path.ts'
import { Schema } from '../types/schema.ts'
import { BIDSContext } from '../schema/context.ts'
import { lookupModality } from '../schema/modalities.ts'
import { CheckFunction } from '../types/check.ts'

const CHECKS: CheckFunction[] = [datatypeFromDirectory, findRuleMatches]

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

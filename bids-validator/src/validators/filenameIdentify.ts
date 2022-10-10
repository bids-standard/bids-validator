// @ts-nocheck
import { SEP } from '../deps/path.ts'
import { Schema } from '../types/schema.ts'
import { BIDSContext } from '../schema/context.ts'
import { lookupModality } from '../schema/modalities.ts'
import { CheckFunction } from '../types/check.ts'

// This should be defined in the schema
const sidecarExtensions = ['.json', '.tsv', '.bvec', '.bval']

const CHECKS: CheckFunction[] = [
  isTopLevel,
  isAssociatedData,
  datatypeFromDirectory,
  isDataFile,
]

export function filenameIdentify(schema, context) {
  for (const check of CHECKS) {
    await check(schema as unknown as GenericSchema, context)
  }
  return Promise.resolve()
}

function isDataFile(schema, context) {
  // skip if we are a known top level or associated data directory.
  if (context.filenameRule.length > 0) {
    return
  }

  const match = []
  let schemaPath = 'rules.datatypes'
  for (const key of Object.keys(schema.rules.datatypes)) {
    /* derivatives is nested in schema, recurse when we see it */
    if (!'entities' in rule[key] && Array.isArray(rule[key])) {
      let isDeriv = key === 'derivatives' || derivative
      await filterRules(rule[key], context, matched, isDeriv)
      continue
    }
    if (rules[key].suffixes.includes(context.suffix)) {
      if (isDeriv) {
        match.push(`${schemaPath}.derivatives.${key}`)
      } else {
        match.push(`${schemaPath}.${key}`)
      }
    }
  }
  return Promise.resolve()
}

function isTopLevel(schema, context) {
  if (context.file.path.split(SEP).length !== 2) {
    return Promise.resolve()
  }

  const top_level_files = schema.rules.top_level_files
  const name = context.file.name.split('.')[0]
  if (top_level_files.hasOwnProperty(name)) {
    context.filenameRules.push(`rules.top_level_files.${name}`)
  }
  return Promise.resolve()
}

function isAssociatedData(schema, context) {
  const associatedData = schema.rules.associated_data
  const parts = context.path.split(SEP)
  if (associatedData.hasOwnProperty(parts[1])) {
    context.filenameRules.push(`rules.associated_data.${parts[1]}`)
  }
  return Promise.resolve()
}

export function datatypeFromDirectory(schema, context) {
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

import type { GenericRule, GenericSchema } from '../types/schema.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'

export interface SchemaFilter {
  path?: string,
  match?: Partial<GenericRule>,
  update?: Partial<GenericRule>
}

export function pruneSchema(
  schema: GenericSchema,
  filters: SchemaFilter[]
): GenericSchema {
  let newSchema = JSON.parse(JSON.stringify(schema))
  newSchema = new Proxy( newSchema as object, objectPathHandler) as GenericSchema
  filters.map(applyFilter.bind(null, newSchema))
  return newSchema
}

function applyFilter(
  schema: GenericSchema,
  filter: SchemaFilter
): GenericSchema {
  if (filter.path && !filter.match) {
    if (filter.update) {
      Object.assign(schema[filter.path], filter.update)
    } else {
      delete schema[filter.path]
    }
    return schema 
  }
  const path = filter.path ?? 'rules'
  _applyFilter(schema, filter, path)
  return schema
}

function _applyFilter(
  schema: GenericSchema,
  filter: SchemaFilter,
  path: string
) {
  if (typeof schema[path] != 'object') {
    return
  }
  if (filter.match && ruleMatch(schema[path], filter.match)) {
    if (filter.update) {
      Object.assign(schema[path], filter.update)
    } else {
      delete schema[path]
    }
  }
  for (const key in schema[path]) {
    _applyFilter(schema, filter, `${path}.${key}`)
  }
  return
}

function ruleMatch(rule: GenericRule, match: Partial<GenericRule>): boolean {
  return (Object.keys(match) as (keyof GenericRule)[]).every((key) => {
    if (typeof rule[key] == 'undefined') return false
    if (Array.isArray(match[key])) {
      return match[key].every(entry => Array.isArray(rule[key]) && rule[key].includes(entry))
    }
    // TODO matches for rule fields that are strings or records
    return false
  })
}

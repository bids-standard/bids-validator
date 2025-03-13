/**
 * Schema structure returned by loadSchema
 */

export interface Format {
  pattern: string
}

export interface Entity {
  name: string
  type: string
  format: string
}

export interface Value {
  value: string
}

export interface SchemaObjects {
  datatypes: Record<string, Value>
  enums: Record<string, Value>
  entities: Record<string, Entity>
  extensions: Record<string, Value>
  files: Record<string, unknown>
  formats: Record<string, Format>
  suffixes: Record<string, Value>
}

export interface SchemaRules {
  entities: string[]
  files: SchemaFiles
  modalities: Record<string, unknown>
  directories: Record<string, Record<string, DirectoryRule>>
}

export interface DirectoryRule {
  name: string
  entity: string
  level: string
  value: string
  subdirs: string[]
  opaque: boolean
}

export interface SchemaFiles {
  common: Record<string, unknown>
  deriv: Record<string, unknown>
  raw: Record<string, unknown>
}

export interface ExpressionTest {
  expression: string
  result: string
}

export interface SchemaMeta {
  expression_tests: ExpressionTest[]
}

export interface Schema {
  objects: SchemaObjects
  rules: SchemaRules
  schema_version: string
  meta: SchemaMeta
}

export interface SchemaIssue {
  code: string
  message: string
  level?: string
}

export type GenericSchema = { [key: string]: GenericRule | GenericSchema }

export interface GenericRule {
  selectors?: string[]
  checks?: string[]
  columns?: Record<string, string>
  additional_columns?: string
  initial_columns?: string[]
  fields: Record<string, SchemaFields>
  issue?: SchemaIssue
  extensions?: string[]
  suffixes?: string[]
  stem?: string
  path?: string
  datatypes?: string[]
  pattern?: string
  name?: string
  format?: string
  required?: string
  index_columns?: string[]
  metadata?: Record<string, string>
}

export interface SchemaFields {
  level: string
  level_addendum?: string
  issue?: SchemaIssue
}

export interface SchemaType {
  type: string
  format?: string
  enum?: string[]
  items?: SchemaType[]
  minItems?: number
  maxItems?: number
  unit?: string
}

interface AnyOf {
  anyOf: SchemaType[]
}

export type SchemaTypeLike = AnyOf | SchemaType

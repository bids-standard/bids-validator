/**
 * Schema structure returned by loadSchema
 */
export interface SchemaObjects {
  top_level_files: Record<string, unknown>
}

export interface SchemaRules {
  files: SchemaFiles
  datatypes: Record<string, unknown>
  modalities: Record<string, unknown>
}

export interface SchemaFiles {
  common: Record<string, unknown>
  deriv: Record<string, unknown>
  raw: Record<string, unknown>
}

export interface Schema {
  objects: SchemaObjects
  rules: SchemaRules
}

export interface SchemaIssue {
  code: string
  message: string
  level?: string
}

export type GenericSchema = { [key: string]: GenericRule | GenericSchema }

export interface GenericRule {
  selectors: string[]
  checks?: string[]
  columns?: Record<string, string>
  additional_columns?: string
  initial_columns?: string[]
  fields: Record<string, SchemaFields>
  issue?: SchemaIssue
}

export interface SchemaFields {
  level: string
  level_addendum?: string
  issue?: SchemaIssue
}

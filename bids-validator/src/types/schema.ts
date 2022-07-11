/**
 * Schema structure returned by loadSchema
 */
export interface SchemaObjects {
  top_level_files: Record<string, unknown>
}

export interface SchemaRules {
  top_level_files: Record<string, unknown>
  datatypes: Record<string, unknown>
  modalities: Record<string, unknown>
}

export interface Schema {
  objects: SchemaObjects
  rules: SchemaRules
}

export type GenericSchema = { [key: string]: GenericRule | GenericSchema }

export interface GenericRule {
  selectors: string[]
  checks: string[]
  columns: Record<string, string>
  additional_columns: string
  initial_columns: string[]
  fields: Record<string, Record<string, string>>
}

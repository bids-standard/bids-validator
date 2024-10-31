export class SchemaStructureError extends Error {
  schemaPath: string
  constructor(schemaPath: string) {
    super(`Validator attempted to access ${schemaPath}, but it wasn't there.`)
    this.name = 'SchemaStructureError'
    this.schemaPath = schemaPath
  }
}

export class SchemaStructureError extends Error {
  constructor(schemaPath) {
    super(`Validator attempted to access ${schemaPath}, but it wasn't there.`)
    this.name = 'SchemaStructureError'
    this.schemaPath = schemaPath
  }
}

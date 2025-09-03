import type { GenericRule } from '../types/schema.ts'
import type { Schema } from '@bids/schema/metaschema'
import type { BIDSContext } from './context.ts'

type ColumnSchema = Schema['objects']['columns'][keyof Schema['objects']['columns']]
type Formats = Schema['objects']['formats']

/* Common target for comparing schema and sidecar definitions */
interface ValueSignature {
  formats: string[]
  pattern?: string
  units?: string
  levels?: string[]
  maximum?: number
  minimum?: number
}

/* Compiled type check specification */
interface ValueSpec {
  pattern: RegExp
  levels?: string[]
  maximum?: number
  minimum?: number
}

/* Sidecar column definition */
interface ColumnDefinition {
  Format?: string
  Levels?: Record<string, unknown>
  Units?: string
  Maximum?: number
  Minimum?: number
}

function _getFormats(schemaObject: ColumnSchema): string[] {
  if (schemaObject.anyOf) {
    const anyOf = schemaObject.anyOf as ColumnSchema[]
    return anyOf.map(_getFormats).flat() as string[]
  }
  return [(schemaObject.format as string) ?? (schemaObject.type as string) ?? 'string']
}

/* Get formats from schema object, accounting for anyOf */
function extractSchema(schemaObject: ColumnSchema): ValueSignature {
  return {
    formats: _getFormats(schemaObject),
    pattern: schemaObject.pattern as string | undefined,
    units: schemaObject.unit as string | undefined,
    levels: schemaObject?.enum as string[] | undefined,
    maximum: schemaObject?.maximum as number | undefined,
    minimum: schemaObject?.minimum as number | undefined,
  }
}

/* Get formats from sidecar column definition */
function extractDefinition(definition: ColumnDefinition): ValueSignature {
  return {
    formats: [definition.Format ?? (definition.Units ? 'number' : 'string')],
    units: definition.Units,
    levels: definition.Levels ? Object.keys(definition.Levels) : undefined,
    maximum: definition.Maximum,
    minimum: definition.Minimum,
  }
}

function _formatToType(format: string): string {
  switch (format) {
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'string'
  }
}

/* Construct a signature that satisfies both input signatures
 * Error if the override conflicts rather than refines
 */
function refineSignature(base: ValueSignature, override: ValueSignature): ValueSignature {
  // Collapse formats to string, number, boolean
  if (!base.formats.map(_formatToType).includes(_formatToType(override.formats[0]))) {
    throw {
      code: 'TSV_COLUMN_TYPE_REDEFINED',
      issueMessage: `Format "${override.formats[0]}" must be ${base.formats.join(' or ')}`,
    }
  }
  // TODO: Compare actual formats; we want to check that override.formats[0]
  // is actually a subset of base.formats
  // TODO: Should we assert that override.formats == ["string"] if base.pattern?

  // Enums must be a subset
  const effectiveLevels = override.levels ?? base.levels as string[]
  if (base.levels !== undefined && override.levels !== undefined) {
    if (!effectiveLevels.every((v) => base.levels?.includes(v))) {
      throw {
        code: 'TSV_COLUMN_TYPE_REDEFINED',
        issueMessage: `Levels {${override.levels.join(', ')}} is not a subset of {${
          base.levels.join(', ')
        }}.`,
      }
    }
  }

  // Units must match
  const effectiveUnits = override.units ?? base.units
  if (base.units !== undefined && effectiveUnits !== base.units) {
    throw {
      code: 'TSV_COLUMN_TYPE_REDEFINED',
      issueMessage: `Unit "${effectiveUnits}" must be "${base.units}"`,
    }
  }

  const effectiveMinimum = override.minimum ?? base.minimum as number
  if (base.minimum !== undefined && effectiveMinimum < base.minimum) {
    throw {
      code: 'TSV_COLUMN_TYPE_REDEFINED',
      issueMessage: `Minimum ${effectiveMinimum} is less than ${base.minimum}`,
    }
  }

  const effectiveMaximum = override.maximum ?? base.maximum as number
  if (base.maximum !== undefined && effectiveMaximum > base.maximum) {
    throw {
      code: 'TSV_COLUMN_TYPE_REDEFINED',
      issueMessage: `Maximum ${effectiveMaximum} is greater than ${base.maximum}`,
    }
  }

  return {
    formats: override.formats,
    pattern: base.pattern,
    units: effectiveUnits,
    levels: effectiveLevels,
    maximum: effectiveMaximum,
    minimum: effectiveMinimum,
  }
}

/* Get the effective ValueSignature for a column, combining schema and sidecar */
function getValueSignature(
  schemaObject: ColumnSchema,
  definition: ColumnDefinition | undefined,
): ValueSignature {
  // definition indicates a fully overridable "conventional" column
  if ('definition' in schemaObject) {
    return extractDefinition(definition ?? (schemaObject.definition as ColumnDefinition))
  }
  // JSON-schema-like definitions may be duplicated or refined by sidecars
  const schemaSignature = extractSchema(schemaObject)
  return definition
    ? refineSignature(schemaSignature, extractDefinition(definition))
    : schemaSignature
}

/* Construct a type check specification from a ValueSignature */
function compileSignature(signature: ValueSignature, formats: Formats): ValueSpec {
  const pattern = signature.pattern ?? signature.formats.map((f) => formats[f].pattern).join('|')
  return {
    pattern: new RegExp(`^${pattern}$`),
    levels: signature.levels,
    maximum: signature.maximum,
    minimum: signature.minimum,
  }
}

/* Identify trivial signatures that would always pass */
function isTrivialSignature(sig: ValueSignature): boolean {
  return sig.levels === undefined &&
    sig.maximum === undefined &&
    sig.minimum === undefined &&
    (sig.pattern === undefined && sig.formats[0] === 'string' || sig.pattern === '.*')
}

/* Check a value against a compiled type check specification */
function checkValue(value: string, spec: ValueSpec): boolean {
  if (value === 'n/a') {
    return true
  }
  if (!spec.pattern.test(value) || spec.levels && !spec.levels.includes(value)) {
    return false
  }
  if (spec.maximum !== undefined || spec.minimum !== undefined) {
    const numValue = parseFloat(value)
    return (spec.maximum === undefined || numValue <= spec.maximum) &&
      (spec.minimum === undefined || numValue >= spec.minimum)
  }
  return true
}

/**
 * Columns in schema rules are assertions about the requirement level of what
 * headers should be present in a tsv file. Examples in specification:
 * schema/rules/tabular_data/*
 *
 * For each column in a rule.tabluar_data check we generate an error if the
 * column is missing from the tsv and listed as required by the schema, a
 * warning if the schema rule is clobbered by the sidecar but shouldn't be. If
 * the column is not in the tsv we bail out and move to the next column,
 * otherwise we type check each value in the column according to the type
 * specified in the schema rule (or sidecar type information if applicable).
 */
export function evalColumns(
  rule: GenericRule,
  context: BIDSContext,
  schema: Schema,
  schemaPath: string,
): void {
  if (!rule.columns || !['.tsv', '.tsv.gz'].includes(context.extension)) return
  const headers = [...Object.keys(context.columns)]
  for (const [ruleHeader, requirement] of Object.entries(rule.columns)) {
    const columnObject: ColumnSchema = schema.objects.columns[ruleHeader]

    // What is this?
    if (!('name' in columnObject) || !columnObject['name']) {
      return
    }

    const name = columnObject.name
    if (!headers.includes(name) && requirement === 'required') {
      context.dataset.issues.add({
        code: 'TSV_COLUMN_MISSING',
        subCode: name,
        location: context.path,
        rule: schemaPath,
      })
    }

    let signature: ValueSignature
    try {
      signature = getValueSignature(columnObject, context?.sidecar[name])
    } catch (e: any) {
      if (e?.code) {
        context.dataset.issues.add({
          ...e,
          subCode: name,
          location: context.sidecarKeyOrigin[name],
          rule: schemaPath,
        })
        signature = getValueSignature(columnObject, undefined)
      } else {
        throw e
      }
    }

    if (!headers.includes(name) || isTrivialSignature(signature)) {
      continue
    }

    const spec = compileSignature(signature, schema.objects.formats)

    const issue = {
      code: 'TSV_VALUE_INCORRECT_TYPE' + (requirement != 'required' ? '_NONREQUIRED' : ''),
      subCode: name,
      location: context.path,
      rule: schemaPath,
    }

    const ageCheck = name === 'age'
    let ageWarningIssued = false

    const column = context.columns[name] as string[]
    for (const [index, value] of column.entries()) {
      if (!checkValue(value, spec)) {
        if (ageCheck && value === '89+') {
          if (!ageWarningIssued) {
            ageWarningIssued = true
            context.dataset.issues.add({
              code: 'TSV_PSEUDO_AGE_DEPRECATED',
              location: context.path,
              line: index + 2,
            })
          }
          continue
        }
        const issueMessage = `'${value}'` +
          (value.match(/^\s*(NA|na|nan|NaN|n\/a)\s*$/) ? ", did you mean 'n/a'?" : '')
        context.dataset.issues.add({
          ...issue,
          line: index + 2,
          issueMessage,
        })
        break
      }
    }
  }
}

/**
 * A small subset of tsv schema rules enforce a specific order of columns.
 * No error is currently provided by the rule itself.
 */
export function evalInitialColumns(
  rule: GenericRule,
  context: BIDSContext,
  schema: Schema,
  schemaPath: string,
): void {
  if (
    !rule?.columns || !rule?.initial_columns || !['.tsv', '.tsv.gz'].includes(context.extension)
  ) {
    return
  }
  const headers = [...Object.keys(context.columns)]
  rule.initial_columns.map((ruleHeader: string, ruleIndex: number) => {
    const ruleHeaderName = schema.objects.columns[ruleHeader].name
    const contextIndex = headers.findIndex((x) => x === ruleHeaderName)
    if (contextIndex === -1) {
      context.dataset.issues.add({
        code: 'TSV_COLUMN_MISSING',
        subCode: ruleHeaderName,
        location: context.path,
        issueMessage: `Column ${ruleIndex} (starting from 0) not found.`,
        rule: schemaPath,
      })
    } else if (ruleIndex !== contextIndex) {
      context.dataset.issues.add({
        code: 'TSV_COLUMN_ORDER_INCORRECT',
        subCode: ruleHeaderName,
        location: context.path,
        issueMessage: `Column ${ruleIndex} (starting from 0) found at index ${contextIndex}.`,
        rule: schemaPath,
      })
    }
  })
}

export function evalAdditionalColumns(
  rule: GenericRule,
  context: BIDSContext,
  schema: Schema,
  schemaPath: string,
): void {
  if (!['.tsv', '.tsv.gz'].includes(context.extension)) return
  const headers = Object.keys(context?.columns)
  if (rule.columns) {
    if (!rule.additional_columns || rule.additional_columns === 'n/a') {
      // Old schemas might be missing the field, so be permissive.
      // New schemas indicate it is not applicable with 'n/a'.
      return
    }
    const ruleHeadersNames = Object.keys(rule.columns).map(
      (x) => schema.objects.columns[x].name,
    )
    let extraCols = headers.filter(
      (header) => !ruleHeadersNames.includes(header),
    )

    if (rule.additional_columns?.startsWith('allowed')) {
      extraCols = extraCols.filter((header) => !(header in context.sidecar))
    }
    const code = rule.additional_columns === 'not_allowed'
      ? 'TSV_ADDITIONAL_COLUMNS_NOT_ALLOWED'
      : rule.additional_columns === 'allowed_if_defined'
      ? 'TSV_ADDITIONAL_COLUMNS_MUST_DEFINE'
      : 'TSV_ADDITIONAL_COLUMNS_UNDEFINED'
    const issue = {
      code,
      location: context.path,
      rule: schemaPath,
    }
    for (const col of extraCols) {
      context.dataset.issues.add({ ...issue, subCode: col })
    }
  }
}

export function evalIndexColumns(
  rule: GenericRule,
  context: BIDSContext,
  schema: Schema,
  schemaPath: string,
): void {
  if (
    !rule?.columns ||
    !rule?.index_columns ||
    !rule?.index_columns.length ||
    !['.tsv', '.tsv.gz'].includes(context.extension)
  ) {
    return
  }
  const headers = Object.keys(context?.columns)
  const uniqueIndexValues = new Set()
  const index_columns = rule.index_columns.map((col: string) => {
    return schema.objects.columns[col].name
  })
  const missing = index_columns.filter((col: string) => !headers.includes(col))
  for (const col of missing) {
    context.dataset.issues.add({
      code: 'TSV_COLUMN_MISSING',
      subCode: col,
      location: context.path,
      rule: schemaPath,
    })
  }

  const rowCount = (context.columns[index_columns[0]] as string[])?.length || 0
  for (let i = 0; i < rowCount; i++) {
    let indexValue = ''
    index_columns.map((col: string) => {
      indexValue = indexValue.concat(
        (context.columns[col] as string[])?.[i] || '',
      )
    })
    if (uniqueIndexValues.has(indexValue)) {
      context.dataset.issues.add({
        code: 'TSV_INDEX_VALUE_NOT_UNIQUE',
        location: context.path,
        issueMessage: `Row: ${i + 2}, Value: ${indexValue}`,
        rule: schemaPath,
      })
    } else {
      uniqueIndexValues.add(indexValue)
    }
  }
}

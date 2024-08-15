import { GenericRule, GenericSchema, SchemaTypeLike } from '../types/schema.ts'
import { BIDSContext } from './context.ts'

/**
 * schema.formats contains named types with patterns. Many entries in
 * schema.objects have a format to constrain its possible values. Presently
 * this is written with tsv's in mind. The blanket n/a pass may be inappropriate
 * for other type checks. filenameValidate predates this but does similar type
 * checking for entities.
 */
function schemaObjectTypeCheck(
  schemaObject: SchemaTypeLike,
  value: string,
  schema: GenericSchema,
): boolean {
  // always allow n/a?
  if (value === 'n/a') {
    return true
  }

  if ('anyOf' in schemaObject) {
    return schemaObject.anyOf.some((x) => schemaObjectTypeCheck(x, value, schema))
  }
  if ('enum' in schemaObject && schemaObject.enum) {
    return schemaObject.enum.some((x) => x === value)
  }

  const format = schemaObject.format
    // @ts-expect-error
    ? schema.objects.formats[schemaObject.format]
    // @ts-expect-error
    : schema.objects.formats[schemaObject.type]
  const re = new RegExp(`^${format.pattern}$`)
  return re.test(value)
}

/**
 * Checks user supplied type information from a sidecar against tsv column value.
 */
function sidecarDefinedTypeCheck(
  rule: object,
  value: string,
  schema: GenericSchema,
): boolean {
  if (
    'Levels' in rule && rule['Levels'] && typeof (rule['Levels']) == 'object'
  ) {
    return value == 'n/a' || value in rule['Levels']
  } else if ('Units' in rule) {
    return schemaObjectTypeCheck({ 'type': 'number' }, value, schema)
  } else {
    return true
  }
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
  schema: GenericSchema,
  schemaPath: string,
): void {
  if (!rule.columns || context.extension !== '.tsv') return
  const headers = [...Object.keys(context.columns)]
  for (const [ruleHeader, requirement] of Object.entries(rule.columns)) {
    // @ts-expect-error
    const columnObject: GenericRule = schema.objects.columns[ruleHeader]
    if (!('name' in columnObject) || !columnObject['name']) {
      return
    }
    const name = columnObject.name
    let typeCheck = (value: string) =>
      schemaObjectTypeCheck(
        columnObject as unknown as SchemaTypeLike,
        value,
        schema,
      )
    const error_code = (requirement != 'required')
      ? 'TSV_VALUE_INCORRECT_TYPE_NONREQUIRED'
      : 'TSV_VALUE_INCORRECT_TYPE'
    let errorObject = columnObject

    if (!headers.includes(name) && requirement === 'required') {
      context.dataset.issues.add({
        code: 'TSV_COLUMN_MISSING',
        subCode: name,
        location: context.path,
        rule: schemaPath,
      })
    }

    if ('definition' in columnObject) {
      typeCheck = (value) =>
        // @ts-expect-error
        sidecarDefinedTypeCheck(columnObject.definition, value, schema)
    }

    const inspect = typeof Deno !== 'undefined'
      ? Deno.inspect
      : (x: any) => JSON.stringify(x, null, 2)

    if (
      name in context.sidecar && context.sidecar[name] &&
      typeof (context.sidecar[name]) === 'object'
    ) {
      if ('definition' in columnObject) {
        typeCheck = (value) => sidecarDefinedTypeCheck(context.sidecar[name], value, schema)
        errorObject = context.sidecar[name]
      } else {
        context.dataset.issues.add({
          code: 'TSV_COLUMN_TYPE_REDEFINED',
          subCode: name,
          location: context.path,
          issueMessage: `defined in ${context.sidecarKeyOrigin[name]}`,
          rule: schemaPath,
        })
      }
    }

    if (!headers.includes(name)) {
      continue
    }

    for (const value of context.columns[name] as string[]) {
      if (
        !typeCheck(value)
      ) {
        context.dataset.issues.add({
          code: error_code,
          subCode: name,
          location: context.path,
          issueMessage: `'${value}'`,
          rule: schemaPath,
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
  schema: GenericSchema,
  schemaPath: string,
): void {
  if (
    !rule?.columns || !rule?.initial_columns || context.extension !== '.tsv'
  ) {
    return
  }
  const headers = [...Object.keys(context.columns)]
  rule.initial_columns.map((ruleHeader: string, ruleIndex: number) => {
    // @ts-expect-error
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
  schema: GenericSchema,
  schemaPath: string,
): void {
  if (context.extension !== '.tsv') return
  const headers = Object.keys(context?.columns)
  // hard coding allowed here feels bad
  if (!(rule.additional_columns === 'allowed') && rule.columns) {
    const ruleHeadersNames = Object.keys(rule.columns).map(
      // @ts-expect-error
      (x) => schema.objects.columns[x].name,
    )
    let extraCols = headers.filter(
      (header) => !ruleHeadersNames.includes(header),
    )
    if (rule.additional_columns === 'allowed_if_defined') {
      extraCols = extraCols.filter((header) => !(header in context.sidecar))
    }
    for (const col of extraCols) {
      context.dataset.issues.add({
        code: 'TSV_ADDITIONAL_COLUMNS_NOT_ALLOWED',
        subCode: col,
        location: context.path,
        rule: schemaPath,
      })
    }
  }
}

export function evalIndexColumns(
  rule: GenericRule,
  context: BIDSContext,
  schema: GenericSchema,
  schemaPath: string,
): void {
  if (
    !rule?.columns ||
    !rule?.index_columns ||
    !rule?.index_columns.length ||
    context.extension !== '.tsv'
  ) {
    return
  }
  const headers = Object.keys(context?.columns)
  const uniqueIndexValues = new Set()
  const index_columns = rule.index_columns.map((col: string) => {
    // @ts-expect-error
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

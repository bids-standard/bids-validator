import { isAtRoot, sidecarExtensions } from './filenames.ts'
import { CheckFunction } from '../types/check.ts'
import { objectPathHandler } from '../utils/objectPathHandler.ts'

const CHECKS: CheckFunction[] = [
  hasMatch,
  missingLabel,
  atRoot,
  entityLabelCheck,
]

function filenameValidate(schema, context) {
  for (const check of CHECKS) {
    // TODO - Resolve this double casting?
    await check(schema as unknown as GenericSchema, context)
  }
  return Promise.resolve()
}

function hasMatch(schema, context) {
  schema = new Proxy(schema, objectPathHandler)
  if (
    context.filenameRules.length === 0 &&
    context.file.path !== '/.bidsignore'
  ) {
    context.issues.addNonSchemaIssue('NOT_INCLUDED', [context.file])
  }

  /* we have matched multiple rules and a datatype, lets see if we have one
   *   rule with the same datatype, if so just use that one.
   */
  if (context.filenameRules.length > 1) {
    const datatypeMatch = context.filenameRules.filter((rulePath) => {
      if (Array.isArray(schema[rulePath].datatypes)) {
        return schema[rulePath].datatypes.includes(context.datatype)
      } else {
        return false
      }
    })
    if (datatypeMatch.length === 1) {
      // validate this rule and no others
    } else {
      // error showing potential rule matches, validate against one or all?
    }
  }
  return Promise.resolve()
}

function missingLabel(schema, context) {
  const fileNoLabelEntities = Object.keys(context.entities).filter(
    (key) => entities[key] === 'NOENTITY',
  )

  const fileEntities = Object.keys(context.entities).filter(
    (key) => !fileNoLabelEntities.includes(key),
  )

  if (fileNoLabelEntities.length) {
    context.issues.addNonSchemaIssue('ENTITY_WITH_NO_LABEL', [
      { ...context.file, evidence: fileNoLabelEntities.join(', ') },
    ])
  }
}

function atRoot(schema, context) {
  /*
  if (fileIsAtRoot && !sidecarExtensions.includes(context.extension)) {
    // create issue for data file in root of dataset
  }
  */
}

function lookupEntityLiteral(name: string, schema: Schema) {
  const entityObj = schema.objects.entities[name]
  if (entityObj && entityObj['name']) {
    return entityObj['name']
  } else {
    // if this happens there is an issue with the schema?
    return ''
  }
}

function getEntityByLiteral(fileEntity: string, schema: Schema) {
  const entities = schema.objects.entities
  const key = Object.keys(entities).find((key) => {
    return entities[key].name === fileEntity
  })
  if (key) {
    return entities[key]
  }
  return null
}

function entityLabelCheck(schema: Schema, context: BIDSContext) {
  const formats = schema.objects.formats
  const entities = schema.objects.entities
  Object.keys(context.entities).map((fileEntity) => {
    const entity = getEntityByLiteral(fileEntity, schema)
    if (entity) {
      // assuming all formats are well defined in schema.objects
      const pattern = formats[entity.format].pattern
      const rePattern = new RegExp(`^${pattern}$`)
      const label = context.entities[fileEntity]
      if (!rePattern.test(label)) {
        context.issues.addNonSchemaIssue('INVALID_ENTITY_LABEL', [
          {
            ...context.file,
            evidence: `entity: ${fileEntity} label: ${label} pattern: ${pattern}`,
          },
        ])
      }
    } else {
      // unknown entity
    }
  })
  return
}

function entityRuleIssue(rule, schema, context) {
  const ruleEntities = Object.keys(rule.entities).map((key) =>
    lookupEntityLiteral(key, schema),
  )
  // skip required entity checks if file is at root.
  // No requirements for inherited sidecars at this level.
  if (!fileIsAtRoot) {
    const ruleEntitiesRequired = Object.entries(rule.entities)
      .filter(([_, v]) => v === 'required')
      .map(([k, _]) => lookupEntityLiteral(k, schema))

    const missingRequired = ruleEntitiesRequired.filter(
      (required) => !fileEntities.includes(required),
    )

    if (missingRequired.length) {
      context.issues.addNonSchemaIssue('MISSING_REQUIRED_ENTITY', [
        { ...context.file, evidence: missingRequired.join(', ') },
      ])
    }
  }

  const entityNotInRule = fileEntities.filter(
    (fileEntity) => !ruleEntities.includes(fileEntity),
  )

  if (entityNotInRule.length) {
    context.issues.addNonSchemaIssue('ENTITY_NOT_IN_RULE', [
      { ...context.file, evidence: entityNotInRule.join(', ') },
    ])
  }
}

function datatypeMismatch(rule, schema, context) {
  if (
    !!context.datatype &&
    rule.datatypes &&
    !rule.datatypes.includes(context.datatype)
  ) {
    context.issues.addNonSchemaIssue('DATATYPE_MISMATCH', [
      { ...context.file, evidence: `Datatype rule being applied: ${rule}` },
    ])
  }
}

function extensionMismatch(rule, schema, context) {
  if (rule.extensions && !rule.extensions.includes(context.extension)) {
    context.issues.addNonSchemaIssue('SUFFIX_MISMATCH', [
      { ...context.file, evidence: `Rule: ${rule}` },
    ])
  }
}

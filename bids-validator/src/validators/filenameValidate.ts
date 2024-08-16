import type { ContextCheckFunction, RuleCheckFunction } from '../types/check.ts'
import { DatasetIssues } from '../issues/datasetIssues.ts'
import type { BIDSContext } from '../schema/context.ts'
import type { Entity, Format, GenericSchema, Schema } from '../types/schema.ts'
import { SEPARATOR_PATTERN } from '@std/path'
import { hasProp } from '../utils/objectPathHandler.ts'

const sidecarExtensions = ['.json', '.tsv', '.bvec', '.bval']

const CHECKS: ContextCheckFunction[] = [
  missingLabel,
  atRoot,
  entityLabelCheck,
  checkRules,
  reconstructionFailure,
]

export async function filenameValidate(
  schema: GenericSchema,
  context: BIDSContext,
) {
  for (const check of CHECKS) {
    await check(schema, context)
  }
  return Promise.resolve()
}

export function isAtRoot(context: BIDSContext) {
  if (context.file.path.split(SEPARATOR_PATTERN).length !== 2) {
    return false
  }
  return true
}

export async function missingLabel(
  schema: GenericSchema,
  context: BIDSContext,
) {
  if (!context.filenameRules.some((rule) => 'suffixes' in schema[rule])) {
    return Promise.resolve()
  }
  const fileNoLabelEntities = Object.keys(context.entities).filter(
    (key) => context.entities[key] === 'NOENTITY',
  )

  const fileEntities = Object.keys(context.entities).filter(
    (key) => !fileNoLabelEntities.includes(key),
  )

  if (fileNoLabelEntities.length) {
    context.dataset.issues.add({
      code: 'ENTITY_WITH_NO_LABEL',
      location: context.path,
      issueMessage: fileNoLabelEntities.join(', '),
    })
  }
  return Promise.resolve()
}

export function atRoot(schema: GenericSchema, context: BIDSContext) {
  /*
  if (fileIsAtRoot && !sidecarExtensions.includes(context.extension)) {
    // create issue for data file in root of dataset
  }
  */
  return Promise.resolve()
}

export function lookupEntityLiteral(name: string, schema: GenericSchema) {
  if (
    schema.objects &&
    hasProp(schema.objects, 'entities') &&
    hasProp(schema.objects.entities, name)
  ) {
    const entityObj = schema.objects.entities[name]
    if (hasProp(entityObj, 'name')) {
      return entityObj.name
    }
  }
  // if this happens there is an issue with the schema?
  return ''
}

function getEntityByLiteral(
  fileEntity: string,
  schema: GenericSchema,
): null | Entity {
  if (
    'entities' in schema.objects &&
    typeof schema.objects.entities === 'object'
  ) {
    const entities = schema.objects.entities
    const key = Object.keys(entities).find((key) => {
      return (
        hasProp(entities, key) &&
        hasProp(entities[key], 'name') &&
        entities[key].name === fileEntity
      )
    })
    if (key && hasProp(entities, key)) {
      return entities[key] as Entity
    }
  }
  return null
}

export async function entityLabelCheck(
  schema: GenericSchema,
  context: BIDSContext,
) {
  if (!('formats' in schema.objects) || !('entities' in schema.objects)) {
    throw new Error('schema missing keys')
  }
  const formats = schema.objects.formats as unknown as Record<string, Format>
  const entities = schema.objects.entities as unknown as Record<string, Entity>
  Object.keys(context.entities).map((fileEntity) => {
    const entity = getEntityByLiteral(fileEntity, schema)
    if (
      entity &&
      entity.format &&
      typeof entity.format === 'string' &&
      hasProp(formats, entity.format)
    ) {
      // assuming all formats are well defined in schema.objects
      const pattern = formats[entity.format].pattern
      const rePattern = new RegExp(`^${pattern}$`)
      const label = context.entities[fileEntity]
      if (!rePattern.test(label)) {
        context.dataset.issues.add({
          code: 'INVALID_ENTITY_LABEL',
          location: context.path,
          issueMessage: `entity: ${fileEntity} label: ${label} pattern: ${pattern}`,
        })
      }
    } else {
      // unknown entity
    }
  })
  return Promise.resolve()
}

const ruleChecks: RuleCheckFunction[] = [
  entityRuleIssue,
  datatypeMismatch,
  extensionMismatch,
  invalidLocation,
]

async function checkRules(schema: GenericSchema, context: BIDSContext) {
  if (context.filenameRules.length === 1) {
    for (const check of ruleChecks) {
      check(
        context.filenameRules[0],
        schema as unknown as GenericSchema,
        context,
      )
    }
  } else {
    const ogIssues = context.dataset.issues
    const noIssues: [string, DatasetIssues][] = []
    const someIssues: [string, DatasetIssues][] = []
    for (const path of context.filenameRules) {
      const tempIssues = new DatasetIssues()
      context.dataset.issues = tempIssues
      for (const check of ruleChecks) {
        check(path, schema as unknown as GenericSchema, context)
      }
      tempIssues.size ? someIssues.push([path, tempIssues]) : noIssues.push([path, tempIssues])
    }
    if (noIssues.length) {
      context.dataset.issues = ogIssues
      context.filenameRules = [noIssues[0][0]]
    } else if (someIssues.length) {
      // What would we want to do with each rules issues? Add all?
      context.dataset.issues = ogIssues
      context.dataset.issues.add({
        code: 'ALL_FILENAME_RULES_HAVE_ISSUES',
        location: context.path,
        issueMessage: `Rules that matched with issues: ${
          someIssues
            .map((x) => x[0])
            .join(', ')
        }`,
      })
    }
  }
  return Promise.resolve()
}

function entityRuleIssue(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (!('entities' in rule)) {
    if (Object.keys(context.entities).length > 0) {
      // Throw issue for entity in file but not rule
    }
    return
  }

  const fileEntities = Object.keys(context.entities)
  const ruleEntities = Object.keys(rule.entities).map((key) => lookupEntityLiteral(key, schema))

  // skip required entity checks if file is at root.
  // No requirements for inherited sidecars at this level.
  if (!isAtRoot(context)) {
    const ruleEntitiesRequired = Object.entries(rule.entities)
      .filter(([_, v]) => v === 'required')
      .map(([k, _]) => lookupEntityLiteral(k, schema))

    const missingRequired = ruleEntitiesRequired.filter(
      (required) => !fileEntities.includes(required as string),
    )

    if (missingRequired.length) {
      context.dataset.issues.add({
        code: 'MISSING_REQUIRED_ENTITY',
        location: context.path,
        issueMessage: `${missingRequired.join(', ')} missing from rule ${path}`,
        rule: path,
      })
    }
  }

  const entityNotInRule = fileEntities.filter(
    (fileEntity) => !ruleEntities.includes(fileEntity),
  )

  if (entityNotInRule.length) {
    context.dataset.issues.add({
      code: 'ENTITY_NOT_IN_RULE',
      location: context.path,
      issueMessage: `${entityNotInRule.join(', ')} not in rule ${path}`,
      rule: path,
    })
  }
}

function datatypeMismatch(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (
    !!context.datatype &&
    Array.isArray(rule.datatypes) &&
    !rule.datatypes.includes(context.datatype)
  ) {
    context.dataset.issues.add({
      code: 'DATATYPE_MISMATCH',
      location: context.path,
      issueMessage: `Datatype rule being applied: ${path}`,
      rule: path,
    })
  }
}

async function extensionMismatch(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (
    Array.isArray(rule.extensions) &&
    !rule.extensions.includes(context.extension)
  ) {
    context.dataset.issues.add({
      code: 'EXTENSION_MISMATCH',
      location: context.path,
      rule: path,
    })
  }
}

async function invalidLocation(
  path: string,
  schema: GenericSchema,
  context: BIDSContext,
) {
  const rule = schema[path]
  if (!('entities' in rule)) {
    return
  }
  const sub: string | undefined = context.entities.sub
  const ses: string | undefined = context.entities.ses

  if (sub) {
    let pattern = `/sub-${sub}/`
    if (ses) {
      pattern += `ses-${ses}/`
    }
    if (!context.path.startsWith(pattern)) {
      context.dataset.issues.add({
        code: 'INVALID_LOCATION',
        location: context.path,
        issueMessage: `Expected location: ${pattern}`,
      })
    }
  }

  if (!sub && context.path.match(/^\/sub-/)) {
    context.dataset.issues.add({
      code: 'INVALID_LOCATION',
      location: context.path,
      issueMessage: `Expected location: /${context.file.name}`,
    })
  }
  if (!ses && context.path.match(/\/ses-/)) {
    context.dataset.issues.add({
      code: 'INVALID_LOCATION',
      location: context.path,
      issueMessage: `Unexpected session directory`,
    })
  }
}

async function reconstructionFailure(
  schema: GenericSchema,
  context: BIDSContext,
) {
  if (Object.keys(context.entities).length === 0) {
    return
  }
  const typedSchema = schema as unknown as Schema
  const entityKeys = typedSchema.rules.entities
    .map((entity) => typedSchema.objects.entities[entity].name)
    .filter((entity) => entity in context.entities)
  // join with hyphen
  const entities = entityKeys.map((entity) => `${entity}-${context.entities[entity]}`)
  const expectedFilename = [...entities, context.suffix + context.extension].join('_')
  if (context.file.name !== expectedFilename) {
    context.dataset.issues.add({
      code: 'FILENAME_MISMATCH',
      location: context.path,
      issueMessage: `Expected filename: ${expectedFilename}`,
    })
  }
}

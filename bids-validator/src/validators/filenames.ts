import { SEP } from '../deps/path.ts'
import { Schema } from '../types/schema.ts'
import { BIDSContext } from '../schema/context.ts'
import { lookupModality } from '../schema/modalities.ts'
import { addIssue } from '../issues/index.ts'

// This should be defined in the schema
const sidecarExtensions = ['.json', '.tsv', '.bvec', '.bval']

export function checkDatatypes(schema: Schema, context: BIDSContext) {
  delete schema.rules.datatypes.derivatives
  const datatypes = Object.values(schema.rules.datatypes)
  for (const rules of datatypes) {
    for (const key of Object.keys(rules)) {
      checkDatatype(rules[key], schema, context)
      if (context.datatype) {
        break
      }
      // we may want to save key into context, gives exact rule name matched
    }
    if (context.datatype) {
      break
    }
  }
}

function checkDatatype(rule, schema: Schema, context: BIDSContext) {
  const { suffix, extension, entities } = context
  const fileIsAtRoot = isAtRoot(context)
  const fileIsSidecar = sidecarExtensions.includes(extension)

  if (rule.suffixies && !rule.suffixes.includes(suffix)) {
    return
  }

  if (rule.extensions && !rule.extensions.includes(extension)) {
    return
  }

  context.datatype = rule.datatypes[0]
  context.modality = lookupModality(schema, context.datatype)

  // context entities are key-value pairs from filename.
  const fileNoLabelEntities = Object.keys(entities).filter(
    key => entities[key] === 'NOENTITY',
  )
  const fileEntities = Object.keys(entities).filter(
    key => !fileNoLabelEntities.includes(key),
  )

  if (fileNoLabelEntities.length) {
    addIssue(
      { file: context.file.path, evidence: fileNoLabelEntities.join(', ') },
      'ENTITY_WITH_NO_LABEL',
    )
  }

  // we need to convert schema centric name to what shows up in filenames
  const ruleEntities = Object.keys(rule.entities).map(key =>
    lookupEntityLiteral(key, schema),
  )

  // skip required entity checks if file is at root.
  // No requirements for inherited sidecars at this level.
  if (!fileIsAtRoot) {
    let ruleEntitiesRequired = Object.entries(rule.entities)
      .filter(([_, v]) => v === 'required')
      .map(([k, _]) => lookupEntityLiteral(k, schema))

    const missingRequired = ruleEntitiesRequired.filter(
      required => !fileEntities.includes(required),
    )

    if (missingRequired.length) {
      addIssue(
        { file: context.file.path, evidence: missingRequired.join(', ') },
        'MISSING_REQUIRED_ENTITY',
      )
    }
  }

  if (fileIsAtRoot && !fileIsSidecar) {
    // create issue for data file in root of dataset
  }

  const entityNotInRule = fileEntities.filter(
    fileEntity => !ruleEntities.includes(fileEntity),
  )

  if (entityNotInRule.length) {
    addIssue(
      { file: context.file.path, evidence: entityNotInRule.join(', ') },
      'ENTITY_NOT_IN_RULE',
    )
  }
  return
}

function lookupEntityLiteral(name: string, schema: Schema) {
  const entityObj = schema.objects.entities[name]
  if (entityObj && entityObj['entity']) {
    return entityObj['entity']
  } else {
    // if this happens theres an issue with the schema?
    return ''
  }
}

function getEntityByLiteral(fileEntity: string, schema: Schema) {
  const entities = schema.objects.entities
  const key = Object.keys(entities).find(key => {
    return entities[key].entity === fileEntity
  })
  if (key) {
    return entities[key]
  }
  return null
}

export function checkLabelFormat(schema: Schema, context: BIDSContext) {
  const formats = schema.objects.formats
  const entities = schema.objects.entities
  Object.keys(context.entities).map(fileEntity => {
    const entity = getEntityByLiteral(fileEntity, schema)
    if (entity) {
      // assuming all formats are well defined in objects
      const pattern = formats[entity.format].pattern
      const rePattern = new RegExp(`^${pattern}$`)
      const label = context.entities[fileEntity]
      if (!rePattern.test(label)) {
        addIssue(
          {
            file: context.file.path,
            evidence: `entity: ${fileEntity} label: ${label} pattern: ${pattern}`,
          },
          'INVALID_ENTITY_LABEL',
        )
      }
    } else {
      // unknown entity
    }
  })
  return
}

export function isAtRoot(context: BIDSContext) {
  if (context.file.path.split(SEP).length !== 2) {
    return false
  }
  return true
}

export function isTopLevel(schema: Schema, context: BIDSContext) {
  if (context.file.path.split(SEP).length !== 2) {
    return false
  }

  const top_level_files = schema.rules.top_level_files
  const name = context.file.name.split('.')[0]
  return top_level_files.hasOwnProperty(name)
}

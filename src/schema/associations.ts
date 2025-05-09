import type {
  Aslcontext,
  Associations,
  Bval,
  Bvec,
  Channels,
  Coordsystem,
  Events,
  M0Scan,
  Magnitude,
  Magnitude1,
} from '@bids/schema/context'
import type { Schema as MetaSchema } from '@bids/schema/metaschema'

import type { BIDSFile, FileTree } from '../types/filetree.ts'
import type { BIDSContext } from './context.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import type { readEntities } from './entities.ts'
import { loadTSV } from '../files/tsv.ts'
import { parseBvalBvec } from '../files/dwi.ts'
import { walkBack } from '../files/inheritance.ts'
import { evalCheck } from './applyRules.ts'
import { expressionFunctions } from './expressionLanguage.ts'

// type AssociationsLookup = Record<keyof ContextAssociations, { extensions: string[], inherit: boolean, load: ... }

/**
 * This object describes associated files for data files in a bids dataset
 * For any given datafile we iterate over every key/value in this object.
 * For each entry we see if any files in the datafiles directory have:
 *   - a suffix that matches the key
 *   - an extension in the entry's extension array.
 *   - that all the files entities and their values match those of the datafile
 * If the entry allows for inheritance we recurse up the filetree looking for other applicable files.
 * The load functions are incomplete, some associations need to read data from a file so they're
 * returning promises for now.
 */
const associationLookup = {
  events: async (file: BIDSFile, options: { maxRows: number }): Promise<Events> => {
    const columns = await loadTSV(file, options.maxRows)
      .catch((e) => {
        return new Map()
      })
    return {
      path: file.path,
      onset: columns.get('onset') || [],
    }
  },
  aslcontext: async (
    file: BIDSFile,
    options: { maxRows: number },
  ): Promise<Aslcontext> => {
    const columns = await loadTSV(file, options.maxRows)
      .catch((e) => {
        return new Map()
      })
    return {
      path: file.path,
      n_rows: columns.get('volume_type')?.length || 0,
      volume_type: columns.get('volume_type') || [],
    }
  },
  m0scan: (file: BIDSFile, options: any): Promise<M0Scan> => {
    return Promise.resolve({ path: file.path })
  },
  magnitude: (file: BIDSFile, options: any): Promise<Magnitude> => {
    return Promise.resolve({ path: file.path })
  },
  magnitude1: (file: BIDSFile, options: any): Promise<Magnitude1> => {
    return Promise.resolve({ path: file.path })
  },
  bval: async (file: BIDSFile, options: any): Promise<Bval> => {
    const contents = await file.text()
    const rows = parseBvalBvec(contents)
    return {
      path: file.path,
      n_cols: rows ? rows[0].length : 0,
      n_rows: rows ? rows.length : 0,
      // @ts-expect-error values is expected to be a number[], coerce lazily
      values: rows[0],
    }
  },
  bvec: async (file: BIDSFile, options: any): Promise<Bvec> => {
    const contents = await file.text()
    const rows = parseBvalBvec(contents)

    if (rows.some((row) => row.length !== rows[0].length)) {
      throw { key: 'BVEC_ROW_LENGTH' }
    }

    return {
      path: file.path,
      n_cols: rows ? rows[0].length : 0,
      n_rows: rows ? rows.length : 0,
    }
  },
  channels: async (file: BIDSFile, options: { maxRows: number }): Promise<Channels> => {
    const columns = await loadTSV(file, options.maxRows)
      .catch((e) => {
        return new Map()
      })
    return {
      path: file.path,
      type: columns.get('type'),
      short_channel: columns.get('short_channel'),
      sampling_frequency: columns.get('sampling_frequency'),
    }
  },
  coordsystem: (file: BIDSFile, options: any): Promise<Coordsystem> => {
    return Promise.resolve({ path: file.path })
  },
}

export async function buildAssociations(
  context: BIDSContext,
): Promise<Associations> {
  const associations: Associations = {}

  const schema: MetaSchema = context.dataset.schema as MetaSchema

  Object.assign(context, expressionFunctions)
  // @ts-expect-error
  context.exists.bind(context)

  for (const [key, rule] of Object.entries(schema.meta.associations)) {
    if (!rule.selectors!.every((x) => evalCheck(x, context))) {
      continue
    }
    let file
    let extension: string[] = []
    if (typeof rule.target.extension === 'string') {
      extension = [rule.target.extension]
    } else if (Array.isArray(rule.target.extension)) {
      extension = rule.target.extension
    }
    try {
      file = walkBack(context.file, rule.inherit, extension, rule.target.suffix).next().value
    } catch (error) {
      if (
        error && typeof error === 'object' && 'code' in error &&
        error.code === 'MULTIPLE_INHERITABLE_FILES'
      ) {
        // @ts-expect-error
        context.dataset.issues.add(error)
        break
      } else {
        throw error
      }
    }

    if (file) {
      // @ts-expect-error
      const load = associationLookup[key]
      // @ts-expect-error
      associations[key] = await load(file, { maxRows: context.dataset.options?.maxRows }).catch(
        (error: any) => {
          if (key in error) {
            context.dataset.issues.add({ code: error.key, location: file.path })
          }
        },
      )
    }
  }
  return Promise.resolve(associations)
}

import type { Aslcontext, Associations, Bval, Bvec, Channels, Events } from '@bids/schema/context'
import type { Schema as MetaSchema } from '@bids/schema/metaschema'

import type { BIDSFile } from '../types/filetree.ts'
import type { BIDSContext } from './context.ts'
import { loadJSON } from '../files/json.ts'
import { loadTSV } from '../files/tsv.ts'
import { parseBvalBvec } from '../files/dwi.ts'
import { readSidecars, walkBack } from '../files/inheritance.ts'
import { evalCheck } from './applyRules.ts'
import { expressionFunctions } from './expressionLanguage.ts'
import { readEntities } from './entities.ts'

import { readText } from '../files/access.ts'

interface WithSidecar {
  sidecar: Record<string, unknown>
}
type LoadFunction = (file: BIDSFile, options: any) => Promise<any>
type MultiLoadFunction = (files: BIDSFile[], options: any) => Promise<any>

function defaultAssociation(file: BIDSFile, _options: any): Promise<{ path: string }> {
  return Promise.resolve({ path: file.path })
}

async function constructSidecar(file: BIDSFile): Promise<Record<string, unknown>> {
  const sidecars = await readSidecars(file)
  // Note ordering here gives precedence to the more specific sidecar
  return sidecars.values().reduce((acc, json) => ({ ...json, ...acc }), {})
}

/**
 * This object describes lookup functions for files associated to data files in a bids dataset.
 * For any given data file we iterate over the associations defined schema.meta.associations.
 * If the selectors match the data file, we attempt to find an associated file,
 * and use the given function to load the data from that file.
 *
 * Many associations only consist of a path; this object is for more complex associations.
 */
const associationLookup: Record<string, LoadFunction> = {
  events: async (file: BIDSFile, options: { maxRows: number }): Promise<Events & WithSidecar> => {
    const columns = await loadTSV(file, options.maxRows)
      .catch((e) => {
        return new Map()
      })
    return {
      path: file.path,
      onset: columns.get('onset') || [],
      sidecar: await constructSidecar(file),
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
  bval: async (file: BIDSFile, options: any): Promise<Bval> => {
    const contents = await readText(file)
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
    const contents = await readText(file)
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
  physio: async (file: BIDSFile, options: any): Promise<{path: string} & WithSidecar> => {
    return {
      path: file.path,
      sidecar: await constructSidecar(file),
    }
  },
}
const multiAssociationLookup: Record<string, MultiLoadFunction> = {
  coordsystems: async (
    files: BIDSFile[],
    options: any,
  ): Promise<{ paths: string[]; spaces: string[]; ParentCoordinateSystems: string[] }> => {
    const jsons = await Promise.allSettled(
      files.map((f) => loadJSON(f).catch(() => ({} as Record<string, unknown>))),
    )
    const parents = jsons.map((j) =>
      j.status === 'fulfilled' ? j.value?.ParentCoordinateSystem : undefined
    ).filter((p) => p) as string[]
    return {
      paths: files.map((f) => f.path),
      spaces: files.map((f) => readEntities(f.name).entities?.space),
      ParentCoordinateSystems: parents,
    }
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
    let file: BIDSFile | BIDSFile[]
    let extension: string[] = []
    if (typeof rule.target.extension === 'string') {
      extension = [rule.target.extension]
    } else if (Array.isArray(rule.target.extension)) {
      extension = rule.target.extension
    }
    try {
      file = walkBack(
        context.file,
        rule.inherit,
        extension,
        rule.target.suffix,
        rule.target?.entities ?? [],
      ).next().value
    } catch (error: any) {
      if (error?.code === 'MULTIPLE_INHERITABLE_FILES') {
        context.dataset.issues.add(error)
        continue
      } else {
        throw error
      }
    }

    if (file && !(Array.isArray(file) && file.length === 0)) {
      const options = { maxRows: context.dataset.options?.maxRows }
      if (key in multiAssociationLookup) {
        const load = multiAssociationLookup[key]
        if (!Array.isArray(file)) {
          file = [file]
        }
        associations[key as keyof Associations] = await load(file, options).catch((e: any) => {})
      } else {
        const load = associationLookup[key] ?? defaultAssociation
        if (Array.isArray(file)) {
          file = file[0]
        }
        const location = file.path
        associations[key as keyof Associations] = await load(file, options).catch(
          (error: any) => {
            if (error.code) {
              context.dataset.issues.add({ ...error, location })
            }
          },
        )
      }
    }
  }
  return Promise.resolve(associations)
}

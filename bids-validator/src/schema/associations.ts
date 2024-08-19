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
import type { BIDSFile, FileTree } from '../types/filetree.ts'
import type { BIDSContext } from './context.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'
import type { readEntities } from './entities.ts'
import { loadTSV } from '../files/tsv.ts'
import { parseBvalBvec } from '../files/dwi.ts'
import { walkBack } from '../files/inheritance.ts'

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
  events: {
    suffix: 'events',
    extensions: ['.tsv'],
    inherit: true,
    load: async (file: BIDSFile): Promise<Events> => {
      const columns = await loadTSV(file)
        .catch((e) => {
          return new Map()
        })
      return {
        path: file.path,
        onset: columns.get('onset') || [],
      }
    },
  },
  aslcontext: {
    suffix: 'aslcontext',
    extensions: ['.tsv'],
    inherit: true,
    load: async (
      file: BIDSFile,
    ): Promise<Aslcontext> => {
      const columns = await loadTSV(file)
        .catch((e) => {
          return new Map()
        })
      return {
        path: file.path,
        n_rows: columns.get('volume_type')?.length || 0,
        volume_type: columns.get('volume_type') || [],
      }
    },
  },
  m0scan: {
    suffix: 'm0scan',
    extensions: ['.nii', '.nii.gz'],
    inherit: false,
    load: (file: BIDSFile): Promise<M0Scan> => {
      return Promise.resolve({ path: file.path })
    },
  },
  magnitude: {
    suffix: 'magnitude',
    extensions: ['.nii', '.nii.gz'],
    inherit: false,
    load: (file: BIDSFile): Promise<Magnitude> => {
      return Promise.resolve({ path: file.path })
    },
  },
  magnitude1: {
    suffix: 'magnitude1',
    extensions: ['.nii', '.nii.gz'],
    inherit: false,
    load: (file: BIDSFile): Promise<Magnitude1> => {
      return Promise.resolve({ path: file.path })
    },
  },
  bval: {
    suffix: 'dwi',
    extensions: ['.bval'],
    inherit: true,
    load: async (file: BIDSFile): Promise<Bval> => {
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
  },
  bvec: {
    suffix: 'dwi',
    extensions: ['.bvec'],
    inherit: true,
    load: async (file: BIDSFile): Promise<Bvec> => {
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
  },
  channels: {
    suffix: 'channels',
    extensions: ['.tsv'],
    inherit: true,
    load: async (file: BIDSFile): Promise<Channels> => {
      const columns = await loadTSV(file)
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
  },
  coordsystem: {
    suffix: 'coordsystem',
    extensions: ['.json'],
    inherit: true,
    load: (file: BIDSFile): Promise<Coordsystem> => {
      return Promise.resolve({ path: file.path })
    },
  },
}

export async function buildAssociations(
  source: BIDSFile,
  issues: DatasetIssues,
): Promise<Associations> {
  const associations: Associations = {}

  for (const [key, value] of Object.entries(associationLookup)) {
    const { suffix, extensions, inherit, load } = value
    let file
    try {
      file = walkBack(source, inherit, extensions, suffix).next().value
    } catch (error) {
      if (error.code === 'MULTIPLE_INHERITABLE_FILES') {
        issues.add(error)
        break
      } else {
        throw error
      }
    }

    if (file) {
      // @ts-expect-error Matching load return value to key is hard
      associations[key] = await load(file).catch((error) => {
        if (error.key) {
          issues.add({ code: error.key, location: file.path })
        }
      })
    }
  }
  return Promise.resolve(associations)
}

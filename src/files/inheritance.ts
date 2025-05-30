import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { readEntities } from '../schema/entities.ts'


type Ret<T> = T extends [string, ...string[]] ? (BIDSFile | BIDSFile[]) : BIDSFile

/** Find associated files in order of proximity to a source file.
 *
 * This function implements the BIDS Inheritance Principle.
 *
 * @param {BIDSFile} source
 *    The source file to start the search from.
 * @param {boolean} [inherit=true]
 *    If true, search up the file tree for associated files.
 *    If false, the associated file must be found in the same directory.
 * @param {string[]} [targetExtensions='.json']
 *    The extensions of associated files.
 * @param {string} [targetSuffix]
 *    The suffix of associated files. If not provided, it defaults to the suffix of the source file.
 * @param {string[]} [targetEntities]
 *    Additional entities permitted in associated files.
 *    A non-empty value implies that multiple values may be returned.
 *    By default, associated files must have a subset of the entities in the source file.
 *
 * @returns {Generator<BIDSFile | BIDSFile[]>}
 *    A generator that yields associated files or arrays of files.
 */
export function* walkBack<T extends string[]>(
  source: BIDSFile,
  inherit: boolean = true,
  targetExtensions: string[] = ['.json'],
  targetSuffix?: string,
  targetEntities?: T,
): Generator<Ret<T>> {
  const sourceParts = readEntities(source.name)

  targetSuffix = targetSuffix || sourceParts.suffix

  let fileTree: FileTree | undefined = source.parent
  while (fileTree) {
    const candidates = fileTree.files.filter((file) => {
      const { suffix, extension, entities } = readEntities(file.name)
      return (
        targetExtensions.includes(extension) &&
        suffix === targetSuffix &&
        Object.keys(entities).every((entity) =>
          entities[entity] === sourceParts.entities[entity] || targetEntities?.includes(entity)
        )
      )
    })
    if (candidates.length > 1) {
      const exactMatch = candidates.find((file) => {
        const { entities } = readEntities(file.name)
        return Object.keys(sourceParts.entities).every((entity) =>
          entities[entity] === sourceParts.entities[entity]
        )
      })
      if (exactMatch) {
        exactMatch.viewed = true
        yield exactMatch
      } else if (targetEntities?.length) {
        candidates.forEach((file) => (file.viewed = true))
        yield candidates as Ret<T>
      } else {
        const paths = candidates.map((x) => x.path).sort()
        throw {
          code: 'MULTIPLE_INHERITABLE_FILES',
          location: paths[0],
          affects: source.path,
          issueMessage: `Candidate files: ${paths}`,
        }
      }
    } else if (candidates.length === 1) {
      candidates[0].viewed = true
      yield candidates[0]
    }
    if (!inherit) break
    fileTree = fileTree.parent
  }
}

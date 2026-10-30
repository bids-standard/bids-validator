/**
 * Parsing of git-annex keys and pointer files.
 *
 * This module has no git or S3 dependencies, so it is safe for the web build.
 */
import { basename } from '@std/path'

export const annexKeyRegex =
  /^(?<hashname>[A-Z0-9]+)-s(?<size>\d+)--(?<digest>[0-9a-fA-F]+)(?<ext>\.[\w\-. ]*)?/

/**
 * Parse a git-annex symlink target string and return the key and size.
 * The target is the full relative path such as:
 *   ../../.git/annex/objects/jJ/2v/MD5E-s5712417--0d1e...nii.gz/MD5E-s5712417--0d1e...nii.gz
 * Returns null if the target does not match the expected annex key format.
 */
export function parseAnnexKey(target: string): { key: string; size: number } | null {
  const key = basename(target)
  const match = key.match(annexKeyRegex)
  if (!match) {
    return null
  }
  const size = +match.groups!.size
  return { key, size }
}

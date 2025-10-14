/**
 * Utilities for reading git-annex metadata
 */
import { dirname, join, parse, SEPARATOR_PATTERN } from '@std/path'
import { default as git } from 'isomorphic-git'
import { createMD5 } from 'hash-wasm'

const textDecoder = new TextDecoder('utf-8')
export const annexKeyRegex =
  /^(?<hashname>[A-Z0-9]+)-s(?<size>\d+)--(?<digest>[0-9a-fA-F]+)(?<ext>\.[\w\-. ]*)?/
export const rmetLineRegex =
  /^(?<timestamp>\d+(\.\d+)?)s (?<uuid>[0-9a-fA-F-]+):V \+(?<version>[^#]+)#(?<path>.+)/

type Rmet = {
  timestamp: number
  uuid: string
  version: string
  path: string
}

export async function readAnnexPath(
  filepath: string,
  options: any,
): Promise<string> {
  const oid = await git.resolveRef({ ref: 'git-annex', ...options })
  const { blob } = await git.readBlob({ oid, filepath, ...options })
  return textDecoder.decode(blob)
}

/**
 * git-annex hashDirLower implementation based on https://git-annex.branchable.com/internals/hashing/
 * Compute the directory path from a git-annex filename
 */
export async function hashDirLower(annexKey: string): Promise<[string, string]> {
  const computeMD5 = await createMD5()
  computeMD5.init()
  computeMD5.update(annexKey)
  const digest = computeMD5.digest('hex')
  return [digest.slice(0, 3), digest.slice(3, 6)]
}

/**
 * Read remote metadata entries for a given annex key
 *
 * *.log.rmet
 * Path: {md5(key)[0:3]}/{md5(key)[3:6]}/{key}.log.rmet
 * Contents:
 *   <timestamp> <uuid>:V +<version>#<path>
 *
 * The general form is <uuid>:<key> [+-]<value> and is an append-only log
 * We may at some point care about doing this correctly.
 */
async function readRmet(key: string, options: any): Promise<Record<string, Rmet>> {
  const hashDirs = await hashDirLower(key)
  const rmet = await readAnnexPath(join(...hashDirs, `${key}.log.rmet`), options)
  const ret: Record<string, Rmet> = {}
  for (const line of rmet.split('\n')) {
    const match = line.match(rmetLineRegex)
    if (match) {
      ret[match!.groups!.uuid] = match!.groups as unknown as Rmet
    }
  }
  return ret
}

/**
 * Read special remote configuration from remote.log
 *
 * remote.log
 *  <uuid> [<key>=<value>]...
 *  keys of interest:
 *    name
 *    type (S3)
 *    publicurl
 *    timestamp
 */
export async function readRemotes(options: any): Promise<Record<string, Record<string, string>>> {
  const remotesText = await readAnnexPath('remote.log', options)
  const byUUID: Record<string, Record<string, string>> = {}
  for (const line of remotesText.split('\n')) {
    const [uuid, ...keyvals] = line.split(' ')
    byUUID[uuid] = Object.fromEntries(keyvals.map((kv) => kv.split('=')))
  }
  return byUUID
}

/**
 * Resolve an annexed file location to an HTTP URL, if a public S3 remote is available
 */
export async function resolveAnnexedFile(
  path: string,
  remote?: string,
  options?: any,
): Promise<{ url: string; size: number }> {
  // path is known to be a symlink
  const target = await Deno.readLink(path)
  const { dir, base } = parse(target)

  if (!options?.gitdir) {
    const dirs = dir.split(SEPARATOR_PATTERN)
    const gitdir = join(dirname(path), ...dirs.slice(0, dirs.indexOf('.git') + 1))
    options = { ...options, gitdir }
  }

  const size = +base.match(annexKeyRegex)?.groups?.size!

  const rmet = await readRmet(base, options)
  const remotes = await readRemotes(options)
  let uuid: string
  if (remote) {
    let matching: string | undefined
    for (const [u, r] of Object.entries(remotes)) {
      // Only consider public S3 remotes.
      // This will need to be expanded for other types of remotes in future
      if (!r?.publicurl) {
        continue
      }
      if (r.name === remote) {
        matching = u
        break
      }
    }
    if (!matching) {
      throw new Error(`No remote named ${remote}`)
    }
    uuid = matching
  } else {
    // Take the newest remote (reverse sort timestamps, take first)
    uuid = Object.entries(rmet).toSorted((a, b) => +b[1].timestamp - +a[1].timestamp)[0][0]
  }
  const { publicurl } = remotes[uuid]

  if (!publicurl) {
    throw new Error(`No publicurl found for remote ${uuid}`)
  }

  const metadata = rmet[uuid]
  const url = `${publicurl}/${metadata.path}?versionId=${metadata.version}`

  return { url, size }
}

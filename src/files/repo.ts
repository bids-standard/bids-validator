/**
 * Utilities for reading git-annex metadata
 */
import { dirname, join, parse, SEPARATOR_PATTERN } from '@std/path'
import { default as git } from 'isomorphic-git'
import { S3Client } from '@bradenmacdonald/s3-lite-client'
import type { S3ClientOptions } from '@bradenmacdonald/s3-lite-client'
import { createMD5 } from 'hash-wasm'
import { memoize } from '../utils/memoize.ts'
import { requestEnvPermission } from '../setup/requestPermissions.ts'

const textDecoder = new TextDecoder('utf-8')
export const annexKeyRegex =
  /^(?<hashname>[A-Z0-9]+)-s(?<size>\d+)--(?<digest>[0-9a-fA-F]+)(?<ext>\.[\w\-. ]*)?/
export const rmetLineRegex =
  /^(?<timestamp>\d+(\.\d+)?)s (?<uuid>[0-9a-fA-F-]+):V \+(?<version_str>.+)/
export const versionRegex = /^(?<version>[^#]+)#(?<path>.+)/

type Rmet = {
  timestamp: number
  uuid: string
  version: string
  path: string
}

class NonSigningClient {
  endPoint: string
  bucket: string

  constructor({
    endPoint,
    bucket,
  }: S3ClientOptions) {
    this.endPoint = endPoint!
    this.bucket = bucket!
  }

  async presignedGetObject(
    objectName: string,
    options: {
      versionId: string,
    }
  ): Promise<string> {
    return `${this.endPoint}/${this.bucket}/${objectName}?versionId=${options.versionId}`
  }
}

async function _createS3Client(options: S3ClientOptions): Promise<S3Client | NonSigningClient> {
  const envPermission = await requestEnvPermission()
  if (envPermission) {
    const accessKey = Deno.env.get('AWS_ACCESS_KEY_ID') || ''
    const secretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''

    if (accessKey && secretKey) {
      return new S3Client({
        accessKey,
        secretKey,
        ...options,
      })
    }
  }
  return new NonSigningClient(options)
}

const createS3Client = memoize(_createS3Client)

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

export function parseRmetLine(line: string): Rmet | null {
  const match = line.match(rmetLineRegex)
  if (!match) {
    return null
  }
  const uuid = match!.groups!.uuid
  const timestamp = parseFloat(match!.groups!.timestamp)
  let versionStr = match!.groups!.version_str as string
  // Base64 encoded version strings are prefixed with '!'
  if (versionStr.startsWith('!')) {
    versionStr = b64toUtf8(versionStr.slice(1))
  }
  const versionMatch = versionStr.match(versionRegex)
  return {
    timestamp,
    uuid,
    version: versionMatch!.groups!.version,
    path: versionMatch!.groups!.path,
  }
}

function b64toUtf8(str: string): string {
  const decoded = atob(str)
  const bytes = Uint8Array.from({ length: decoded.length }, (_, i) => decoded.charCodeAt(i))
  return textDecoder.decode(bytes)
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
    const entry = parseRmetLine(line)
    if (entry) {
      ret[entry.uuid] = entry
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
async function _readRemotes(options: any): Promise<Record<string, Record<string, string>>> {
  const remotesText = await readAnnexPath('remote.log', options)
  const byUUID: Record<string, Record<string, string>> = {}
  for (const line of remotesText.split('\n')) {
    const [uuid, ...keyvals] = line.split(' ')
    byUUID[uuid] = Object.fromEntries(keyvals.map((kv) => kv.split('=')))
  }
  return byUUID
}

const readRemotes = memoize(_readRemotes, (options) => options?.gitdir)

export async function parseAnnexedFile(
  path: string,
): Promise<{ key: string; size: number; gitdir: string }> {
  const target = await Deno.readLink(path)
  const { dir, base } = parse(target)

  const dirs = dir.split(SEPARATOR_PATTERN)
  const gitdir = join(dirname(path), ...dirs.slice(0, dirs.indexOf('.git') + 1))

  const size = +base.match(annexKeyRegex)?.groups?.size!

  return { key: base, size, gitdir }
}

/**
 * Resolve an annexed file location to an HTTP URL, if a public S3 remote is available
 */
export async function resolveAnnexedFile(
  key: string,
  remote?: string,
  options?: any,
): Promise<{ url: string }> {
  const rmet = await readRmet(key, options)
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
  const { host, bucket } = remotes[uuid]

  if (!host || !bucket) {
    throw new Error(`No public url found for remote ${uuid}`)
  }

  const metadata = rmet[uuid]
  const client = await createS3Client({ endpoint: `https://${host}`, bucket })
  const url = await client.presignedGetObject(metadata.path, {versionId: metadata.version})

  return { url }
}

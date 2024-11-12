/**
 * GZIP
 * Module for extracting gzip metadata from a file
 */
import type { Gzip } from '@bids/schema/context'
import type { BIDSFile } from '../types/filetree.ts'

/**
 * Parse a gzip header from a file
 *
 * Extracts the timestamp, filename, and comment from a gzip file,
 * sufficient to determine if there may be non-obvious leakage of
 * sensitive information.
 *
 * @param file - The file to parse
 * @param maxBytes - The maximum number of bytes to read
 */
export async function parseGzip(
  file: BIDSFile,
  maxBytes: number = 512,
): Promise<Gzip | undefined> {
  const buf = await file.readBytes(maxBytes)
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  if (view.byteLength < 2 || view.getUint16(0, false) !== 0x1f8b) return undefined

  const flags = buf[3]
  const hasExtra = flags & 0x04 // FEXTRA
  const hasFilename = flags & 0x08 // FNAME
  const hasComment = flags & 0x10 // FCOMMENT

  const timestamp = view.getUint32(4, true)

  let offset = 10
  if (hasExtra) {
    const xlen = view.getUint16(10, true)
    offset += 2 + xlen
  }

  let filename = ''
  if (hasFilename) {
    const end = buf.indexOf(0, offset)
    filename = new TextDecoder().decode(buf.subarray(offset, end))
    offset = end + 1
  }

  let comment = ''
  if (hasComment) {
    const end = buf.indexOf(0, offset)
    comment = new TextDecoder().decode(buf.subarray(offset, end))
  }

  return { timestamp, filename, comment }
}

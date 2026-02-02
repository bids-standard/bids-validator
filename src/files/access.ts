import { type BIDSFile } from '../types/filetree.ts'
import { type Issue } from '../types/issues.ts'
import { filememoize } from '../utils/memoize.ts'
import { logger } from '../utils/logger.ts'

function IOErrorToIssue(err: { code: string; name: string }): Issue {
  let issueMessage: string | undefined = undefined
  if (err.code === 'ENOENT' || err.code === 'ELOOP') {
    issueMessage = 'Possible dangling symbolic link'
  }
  return { code: 'FILE_READ', subCode: err.name, issueMessage }
}

export async function openStream(
  file: BIDSFile,
): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
  return file.stream().catch((err: any) => {
    logger.debug(`Error opening stream from file ${file.path}: ${err}`)
    throw { location: file.path, ...IOErrorToIssue(err) }
  })
}

async function _readBytes(
  file: BIDSFile,
  size: number,
  offset = 0,
): Promise<Uint8Array<ArrayBuffer>> {
  return file.readBytes(size, offset).catch((err: any) => {
    logger.debug(`Error reading bytes from file ${file.path}: ${err}`)
    throw { location: file.path, ...IOErrorToIssue(err) }
  })
}

export const readBytes = filememoize(_readBytes)

async function _readText(file: BIDSFile): Promise<string> {
  return file.text().catch((err: any) => {
    logger.debug(`Error reading text from file ${file.path}: ${err}`)
    throw { location: file.path, ...IOErrorToIssue(err) }
  })
}

export const readText = filememoize(_readText)

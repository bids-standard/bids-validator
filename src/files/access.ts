import type { BIDSFile } from '../types/filetree.ts'
import type { Issue } from '../types/issues.ts'
import { IssueError } from '../issues/datasetIssues.ts'
import { filememoize } from '../utils/memoize.ts'
import { logger } from '../utils/logger.ts'

function IOErrorToIssue(err: { code: string; name: string }): Issue {
  let issueMessage: string | undefined = undefined
  if (err.code === 'ENOENT' || err.code === 'ELOOP') {
    issueMessage = 'Possible dangling symbolic link'
  }
  return { code: 'FILE_READ', subCode: err.name, issueMessage }
}

/**
 * Build a rejection handler for a failed read of `file`.
 *
 * An {@link IssueError} from the opener is rethrown as is, with its location
 * set to the file's path if unset. Any other error becomes a `FILE_READ` issue.
 *
 * @param file - File whose opener rejected.
 * @param action - Description of the failed operation, for the debug log.
 */
function handleReadError(file: BIDSFile, action: string): (err: unknown) => never {
  return (err) => {
    logger.debug(`Error ${action} file ${file.path}: ${err}`)
    if (err instanceof IssueError) {
      err.issue.location ??= file.path
      throw err
    }
    throw new IssueError(
      { location: file.path, ...IOErrorToIssue(err as { code: string; name: string }) },
      { cause: err },
    )
  }
}

/**
 * Open `file` as a byte stream.
 *
 * @throws {IssueError} If the opener rejects: its own `IssueError`, or `FILE_READ`.
 */
export function openStream(
  file: BIDSFile,
): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
  return file.stream().catch(handleReadError(file, 'opening stream from'))
}

function _readBytes(
  file: BIDSFile,
  size: number,
  offset = 0,
): Promise<Uint8Array<ArrayBuffer>> {
  return file.readBytes(size, offset).catch(handleReadError(file, 'reading bytes from'))
}

export const readBytes = filememoize(_readBytes)

function _readText(file: BIDSFile): Promise<string> {
  return file.text().catch(handleReadError(file, 'reading text from'))
}

export const readText = filememoize(_readText)

/**
 * Check whether `file` has readable content.
 *
 * Resolves `false` if `file.resolve()` rejects with an {@link IssueError}.
 * Other rejections resolve `true`, so that the read that follows reports them
 * as `FILE_READ`.
 *
 * @param file - File to check.
 */
export function isResolvable(file: BIDSFile): Promise<boolean> {
  return file.resolve().then(
    () => true,
    (err) => !(err instanceof IssueError),
  )
}

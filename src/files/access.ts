import { type BIDSFile } from '../types/filetree.ts'
import { type Issue } from '../types/issues.ts'

function IOErrorToIssue(err: { code: string; name: string }): Issue {
  const subcode = err.name
  let issueMessage: string | undefined = undefined
  if (err.code === 'ENOENT' || err.code === 'ELOOP') {
    issueMessage = 'Possible dangling symbolic link'
  }
  return { code: 'FILE_READ', subCode: err.name, issueMessage }
}

export function openStream(file: BIDSFile): ReadableStream<Uint8Array<ArrayBuffer>> {
  try {
    return file.stream
  } catch (err: any) {
    throw { location: file.path, ...IOErrorToIssue(err) }
  }
}

export async function readBytes(
  file: BIDSFile,
  size: number,
  offset = 0,
): Promise<Uint8Array<ArrayBuffer>> {
  return file.readBytes(size, offset).catch((err: any) => {
    throw { location: file.path, ...IOErrorToIssue(err) }
  })
}

export async function readText(file: BIDSFile): Promise<string> {
  return file.text().catch((err: any) => {
    throw { location: file.path, ...IOErrorToIssue(err) }
  })
}

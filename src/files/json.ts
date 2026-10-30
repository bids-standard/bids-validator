import { filememoize } from '../utils/memoize.ts'
import { IssueError } from '../issues/datasetIssues.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { readBytes } from './access.ts'

async function readJSONText(file: BIDSFile): Promise<string> {
  // Read JSON text from a file
  // JSON must be encoded in UTF-8 without a byte order mark (BOM)
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
  // Streaming TextDecoders are buggy in Deno and Chrome, so read the
  // entire file into memory before decoding and parsing
  const data = await readBytes(file, file.size)
  let text: string
  try {
    text = decoder.decode(data)
  } catch (error) {
    throw new IssueError({ code: 'INVALID_JSON_ENCODING' }, { cause: error })
  } finally {
    decoder.decode() // Reset decoder
  }
  if (text.startsWith('\uFEFF')) {
    throw new IssueError({ code: 'INVALID_JSON_ENCODING' })
  }
  return text
}

async function _loadJSON(file: BIDSFile): Promise<Record<string, unknown>> {
  const text = await readJSONText(file) // Raise encoding errors
  let parsedText
  try {
    parsedText = JSON.parse(text)
  } catch (error) {
    throw new IssueError({ code: 'JSON_INVALID' }, { cause: error }) // Raise syntax errors
  }
  if (Array.isArray(parsedText) || typeof parsedText !== 'object') {
    throw new IssueError({
      code: 'JSON_NOT_AN_OBJECT',
      issueMessage: text.substring(0, 10) + (text.length > 10 ? '...' : ''),
    })
  }
  return parsedText
}

export const loadJSON = filememoize(_loadJSON)

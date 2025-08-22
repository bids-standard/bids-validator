import type { BIDSFile } from '../types/filetree.ts'

async function readJSONText(file: BIDSFile): Promise<string> {
  // Read JSON text from a file
  // JSON must be encoded in UTF-8 without a byte order mark (BOM)
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
  // Streaming TextDecoders are buggy in Deno and Chrome, so read the
  // entire file into memory before decoding and parsing
  const data = await file.readBytes(file.size)
  try {
    const text = decoder.decode(data)
    if (text.startsWith('\uFEFF')) {
      throw {}
    }
    return text
  } catch (error) {
    throw { key: 'INVALID_JSON_ENCODING' }
  } finally {
    decoder.decode() // Reset decoder
  }
}

export async function loadJSON(file: BIDSFile): Promise<Record<string, unknown>> {
  const text = await readJSONText(file) // Raise encoding errors
  let parsedText
  try {
    parsedText = JSON.parse(text)
  } catch (error) {
    throw { key: 'JSON_INVALID' } // Raise syntax errors
  }
  if (Array.isArray(parsedText) || typeof parsedText !== 'object') {
    throw {
      key: 'JSON_NOT_AN_OBJECT',
      evidence: text.substring(0, 10) + (text.length > 10 ? '...' : ''),
    }
  }
  return parsedText
}

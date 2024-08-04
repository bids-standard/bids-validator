import { BIDSFile } from '../types/filetree.ts'

export async function loadJSON(file: BIDSFile): Promise<Record<string, unknown>> {
  // Parse JSON more strictly than other files
  // Do not replace invalid UTF-8 characters or strip the byte order mark (BOM)
  const text = await file.text({ fatal: true, ignoreBOM: true }).catch((error) => {
    throw { key: 'INVALID_JSON_ENCODING' }
  })
  // A BOM would cause a syntax error in JSON.parse, but we treat it as an encoding error
  if (text.match(/^\uFEFF/)) {
    throw { key: 'INVALID_JSON_ENCODING' }
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    throw { key: 'JSON_INVALID' }
  }
}

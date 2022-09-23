import 'https://raw.githubusercontent.com/rii-mango/NIFTI-Reader-JS/master/release/current/nifti-reader-min.js'
import { BIDSFileDeno } from './deno.ts'

export function loadHeader(file: BIDSFile) {
  const header = nifti.readHeader(Deno.readFileSync(file._getPath()).buffer)
  // normalize between nifti-reader and spec schema
  header.pixdim = header.pixDims
  header.dim = header.dims
  return header
}

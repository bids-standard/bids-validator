import 'https://raw.githubusercontent.com/rii-mango/NIFTI-Reader-JS/master/release/current/nifti-reader-min.js'
import { BIDSFileDeno } from './deno.ts'

export function loadHeader(file: BIDSFileDeno) {
  const header = nifti.readHeader(Deno.readFileSync(file._getPath()).buffer)
  // normalize between nifti-reader and spec schema
  // https://github.com/bids-standard/bids-specification/blob/master/src/schema/meta/context.yaml#L200
  header.pixdim = header.pixDims
  header.dim = header.dims
  return header
}

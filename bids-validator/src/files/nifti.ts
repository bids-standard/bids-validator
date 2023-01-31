import 'https://raw.githubusercontent.com/rii-mango/NIFTI-Reader-JS/master/release/current/nifti-reader-min.js'
import { BIDSFile } from '../types/file.ts'

export function loadHeader(file: BIDSFile) {
  const buf = file.readBytes(1024)
  // @ts-expect-error
  const header = globalThis.nifti.readHeader(buf.buffer)
  // normalize between nifti-reader and spec schema
  // https://github.com/bids-standard/bids-specification/blob/master/src/schema/meta/context.yaml#L200
  if (header) {
    header.pixdim = header.pixDims
    header.dim = header.dims
  }
  return header
}

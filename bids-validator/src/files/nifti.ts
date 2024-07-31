import { isCompressed, readHeader } from '../deps/nifti.ts'
import { BIDSFile } from '../types/filetree.ts'
import { logger } from '../utils/logger.ts'
import { ContextNiftiHeader } from '../types/context.ts'

async function extract(buffer: Uint8Array, nbytes: number): Promise<Uint8Array> {
  // The fflate decompression that is used in nifti-reader does not like
  // truncated data, so pretend that we have a stream and stop reading
  // when we have enough bytes.
  const result = new Uint8Array(nbytes)
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(buffer)
    },
  })
  const reader = stream.pipeThrough(new DecompressionStream('gzip')).getReader()
  let offset = 0
  while (offset < nbytes) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }
    result.set(value.subarray(0, Math.min(value.length, nbytes - offset)), offset)
    offset += value.length
  }
  await reader.cancel()
  return result
}

export async function loadHeader(file: BIDSFile): Promise<ContextNiftiHeader | undefined> {
  try {
    const buf = await file.readBytes(1024)
    const data = isCompressed(buf.buffer) ? await extract(buf, 540) : buf
    const header = readHeader(data.buffer)
    // normalize between nifti-reader and spec schema
    // https://github.com/bids-standard/bids-specification/blob/master/src/schema/meta/context.yaml#L200
    if (header) {
      // @ts-expect-error
      header.pixdim = header.pixDims
      // @ts-expect-error
      header.dim = header.dims
    }
    return header as unknown as ContextNiftiHeader
  } catch (err) {
    logger.warning(`NIfTI file could not be opened or read ${file.path}`)
    logger.debug(err)
    return
  }
}

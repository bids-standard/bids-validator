import { isCompressed, isNIFTI1, isNIFTI2, NIFTI1, NIFTI2 } from '@mango/nifti'
import type { BIDSFile } from '../types/filetree.ts'
import { logger } from '../utils/logger.ts'
import type { NiftiHeader } from '@bids/schema/context'

async function extract(buffer: Uint8Array, nbytes: number): Promise<Uint8Array<ArrayBuffer>> {
  // The fflate decompression that is used in nifti-reader does not like
  // truncated data, so pretend that we have a stream and stop reading
  // when we have enough bytes.
  const result = new Uint8Array(nbytes)
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(buffer)
      controller.close()
    },
  })
  const reader = stream.pipeThrough(new DecompressionStream('gzip')).getReader()
  let offset = 0
  try {
    while (offset < nbytes) {
      const { value, done } = await reader.read()
      if (done || !value) {
        break
      }
      result.set(value.subarray(0, Math.min(value.length, nbytes - offset)), offset)
      offset += value.length
    }
  } finally {
    await reader.cancel()
  }
  return result.subarray(0, offset)
}

export async function loadHeader(file: BIDSFile): Promise<NiftiHeader> {
  try {
    const buf = await file.readBytes(1024)
    const data = isCompressed(buf.buffer) ? await extract(buf, 540) : buf.slice(0, 540)
    let header
    if (isNIFTI1(data.buffer)) {
      header = new NIFTI1()
      // Truncate to 348 bytes to avoid attempting to parse extensions
      header.readHeader(data.buffer.slice(0, 348))
    } else if (isNIFTI2(data.buffer)) {
      header = new NIFTI2()
      header.readHeader(data.buffer)
    }
    if (!header) {
      throw { key: 'NIFTI_HEADER_UNREADABLE' }
    }
    const ndim = header.dims[0]
    return {
      dim: header.dims,
      // Hack: round pixdim to 3 decimal places; schema should add rounding function
      pixdim: header.pixDims.map((pixdim) => Math.round(pixdim * 1000) / 1000),
      shape: header.dims.slice(1, ndim + 1),
      voxel_sizes: header.pixDims.slice(1, ndim + 1),
      dim_info: {
        freq: header.dim_info & 0x03,
        phase: (header.dim_info >> 2) & 0x03,
        slice: (header.dim_info >> 4) & 0x03,
      },
      xyzt_units: {
        xyz: ['unknown', 'meter', 'mm', 'um'][header.xyzt_units & 0x03],
        t: ['unknown', 'sec', 'msec', 'usec'][(header.xyzt_units >> 3) & 0x03],
      },
      qform_code: header.qform_code,
      sform_code: header.sform_code,
    } as NiftiHeader
  } catch (err) {
    throw { key: 'NIFTI_HEADER_UNREADABLE' }
  }
}

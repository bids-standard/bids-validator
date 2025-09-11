import { isCompressed, isNIFTI1, isNIFTI2, NIFTI1, NIFTI2 } from '@mango/nifti'
import type { BIDSFile } from '../types/filetree.ts'
import { logger } from '../utils/logger.ts'
import type { NiftiHeader } from '@bids/schema/context'
import { readBytes } from './access.ts'

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
  const buf = await readBytes(file, 1024)
  try {
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
      throw { code: 'NIFTI_HEADER_UNREADABLE' }
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
      axis_codes: axisCodes(header.affine),
    } as NiftiHeader
  } catch (err) {
    throw { code: 'NIFTI_HEADER_UNREADABLE' }
  }
}

/** Vector addition */
function add(a: number[], b: number[]): number[] {
  return a.map((x, i) => x + b[i])
}

/** Vector subtraction */
function sub(a: number[], b: number[]): number[] {
  return a.map((x, i) => x - b[i])
}

/** Scalar multiplication */
function scale(vec: number[], scalar: number): number[] {
  return vec.map((x) => x * scalar)
}

/** Dot product */
function dot(a: number[], b: number[]): number {
  return a.map((x, i) => x * b[i]).reduce((acc, x) => acc + x, 0)
}

function argMax(arr: number[]): number {
  return arr.reduce((acc, x, i) => (x > arr[acc] ? i : acc), 0)
}

/**
 * Identify the nearest principle axes of an image affine.
 *
 * Affines transform indices in a data array into mm right, anterior and superior of
 * an origin in "world coordinates". If moving along an axis in the positive direction
 * predominantly moves right, that axis is labeled "R".
 *
 * @example The identity matrix is in "RAS" orientation:
 *
 * # Usage
 *
 * ```ts
 * const affine = [[1, 0, 0, 0],
 *                 [0, 1, 0, 0],
 *                 [0, 0, 1, 0],
 *                 [0, 0, 0, 1]]
 *
 * axisCodes(affine)
 * ```
 *
 * # Result
 * ```ts
 * ['R', 'A', 'S']
 * ```
 *
 * @returns character codes describing the orientation of an image affine.
 */
export function axisCodes(affine: number[][]): string[] {
  // This function is an extract of the Python function transforms3d.affines.decompose44
  // (https://github.com/matthew-brett/transforms3d/blob/6a43a98/transforms3d/affines.py#L10-L153)
  //
  // As an optimization, this only orthogonalizes the basis,
  // and does not normalize to unit vectors.

  // Operate on columns, which are the cosines that project input coordinates onto output axes
  const [cosX, cosY, cosZ] = [0, 1, 2].map((j) => [0, 1, 2].map((i) => affine[i][j]))

  // Orthogonalize cosY with respect to cosX
  const orthY = sub(cosY, scale(cosX, dot(cosX, cosY)))

  // Orthogonalize cosZ with respect to cosX and orthY
  const orthZ = sub(
    cosZ,
    add(scale(cosX, dot(cosX, cosZ)), scale(orthY, dot(orthY, cosZ))),
  )

  const basis = [cosX, orthY, orthZ]
  const maxIndices = basis.map((row) => argMax(row.map(Math.abs)))

  // Check that indices are 0, 1 and 2 in some order
  if (maxIndices.toSorted().some((idx, i) => idx !== i)) {
    throw { key: 'AMBIGUOUS_AFFINE' }
  }

  // Positive/negative codes for each world axis
  const codes = ['RL', 'AP', 'SI']
  return maxIndices.map((idx, i) => codes[idx][basis[i][idx] > 0 ? 0 : 1])
}

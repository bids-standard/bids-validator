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
    } as NiftiHeader
  } catch (err) {
    throw { code: 'NIFTI_HEADER_UNREADABLE' }
  }
}

function add(a: number[], b: number[]): number[] {
  return a.map((x, i) => x + b[i])
}

function sub(a: number[], b: number[]): number[] {
  return a.map((x, i) => x - b[i])
}

function scale(vec: number[], scalar: number): number[] {
  return vec.map((x) => x * scalar)
}

function dot(a: number[], b: number[]): number {
  return a.map((x, i) => x * b[i]).reduce((acc, x) => acc + x, 0)
}

function extractRotation(affine: number[][]): number[][] {
  // This function is an extract of the Python function transforms3d.affines.decompose44
  // (https://github.com/matthew-brett/transforms3d/blob/6a43a98/transforms3d/affines.py#L10-L153)
  //
  // To explain the conventions of the s{xyz}* parameters:
  //
  // The upper left 3x3 of the affine is a matrix we will call RZS which can be decomposed
  //
  //    RZS = R * Z * S
  //
  // where R is a 3x3 rotation matrix, Z is a diagonal matrix of scalings
  //
  //    Z = diag([sx, xy, sz])
  //
  // and S is a shear matrix with the form
  //
  //    S = [[1, sxy, sxz],
  //         [0,   1, syz],
  //         [0,   0,   1]]
  //
  // Note that this function does not return scales, shears or translations, and
  // does not guarantee a right-handed rotation matrix, as that is not necessary for our use.

  // Operate on columns, which are the cosines that project input coordinates onto output axes
  const [cosX, cosY, cosZ] = [0, 1, 2].map((j) => [0, 1, 2].map((i) => affine[i][j]))

  const sx = Math.sqrt(dot(cosX, cosX))
  const normX = cosX.map((x) => x / sx) // Unit vector

  // Orthogonalize cosY with respect to normX
  const sx_sxy = dot(normX, cosY)
  const orthY = sub(cosY, scale(normX, sx_sxy))
  const sy = Math.sqrt(dot(orthY, orthY))
  const normY = orthY.map((y) => y / sy)

  // Orthogonalize cosZ with respect to normX and normY
  const sx_sxz = dot(normX, cosZ)
  const sy_syz = dot(normY, cosZ)
  const orthZ = sub(cosZ, add(scale(normX, sx_sxz), scale(normY, sy_syz)))
  const sz = Math.sqrt(dot(orthZ, orthZ))
  const normZ = orthZ.map((z) => z / sz)

  // Transposed normalized cosines
  return [normX, normY, normZ]
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
  // Note that rotation is transposed
  const rotations = extractRotation(affine)
  const maxIndices = rotations.map((row) => argMax(row.map(Math.abs)))

  // Check that indices are 0, 1 and 2 in some order
  if (maxIndices.toSorted().some((idx, i) => idx !== i)) {
    throw { key: 'AMBIGUOUS_AFFINE' }
  }

  // Positive/negative codes for each world axis
  const codes = ['RL', 'AP', 'SI']
  return maxIndices.map((idx, i) => codes[idx][rotations[i][idx] > 0 ? 0 : 1])
}

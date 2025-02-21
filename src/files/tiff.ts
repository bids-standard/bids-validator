/**
 * TIFF
 * Module for extracting Tiff metadata
 */
import type { Ome, Tiff } from '@bids/schema/context'
import * as XML from '@libs/xml'
import type { BIDSFile } from '../types/filetree.ts'

function getImageDescription(
  dataview: DataView<ArrayBuffer>,
  littleEndian: boolean,
  IFDsize: number,
): string | undefined {
  // Custom implementation based off of
  // https://www.alternatiff.com/resources/TIFF6.pdf
  // https://www.loc.gov/preservation/digital/formats/fdd/fdd000328.shtml
  //
  // The TIFF header is 8 bytes long, and the second 4 bytes are the offset to the IFD list
  // The IFD list starts with a 2 byte count of the number of IFDs, followed by offsets to each IFD
  // Each IFD is 12 (or 20) bytes long, and the first 2 bytes are the tag, bytes 4-8 are the count
  // of values, and bytes 8-12 are the value or the offset to the values
  //
  // The ImageDescription tag is 0x010e, and the value is a UTF-8 string
  const IFDoffset = dataview.getUint32(4, littleEndian)
  const IFDcount = dataview.getUint16(IFDoffset, littleEndian)
  for (let i = 0; i < IFDcount; i++) {
    if (dataview.getUint16(IFDoffset + 2 + i * IFDsize, littleEndian) === 0x010e) {
      const nbytes = dataview.getUint32(IFDoffset + 2 + i * IFDsize + 4, littleEndian)
      const offset = dataview.getUint32(IFDoffset + 2 + i * IFDsize + 8, littleEndian)
      return new TextDecoder().decode(dataview.buffer.slice(offset, offset + nbytes))
    }
  }
}

/**
 * Parse TIFF metadata
 *
 * @param file - BIDSFile object
 * @param OME - boolean to determine if OME metadata should be parsed
 *
 * @returns Object containing TIFF and OME metadata
 */
export async function parseTIFF(
  file: BIDSFile,
  OME: boolean,
): Promise<{ tiff?: Tiff; ome?: Ome }> {
  const buf = await file.readBytes(4096)
  const dataview = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const magic = dataview.getUint16(0, true)
  const littleEndian = magic === 0x4949
  const isTiff = littleEndian || magic === 0x4d4d
  if (!isTiff) return {}

  const version = dataview.getUint16(2, littleEndian)
  if (!OME) {
    return { tiff: { version } }
  }

  const imageDescription = getImageDescription(dataview, littleEndian, version === 42 ? 12 : 20)
  const omexml = await XML.parse(imageDescription || '') as { [key: string]: any }
  const Pixels = omexml?.OME?.Image?.Pixels
  if (!Pixels) return { tiff: { version } }

  return {
    tiff: { version },
    ome: {
      PhysicalSizeX: parseFloat(Pixels['@PhysicalSizeX']),
      PhysicalSizeY: parseFloat(Pixels['@PhysicalSizeY']),
      PhysicalSizeZ: parseFloat(Pixels['@PhysicalSizeZ']),
      PhysicalSizeXUnit: Pixels['@PhysicalSizeXUnit'],
      PhysicalSizeYUnit: Pixels['@PhysicalSizeYUnit'],
      PhysicalSizeZUnit: Pixels['@PhysicalSizeZUnit'],
    },
  }
}

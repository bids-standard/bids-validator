/*
 * DWI
 * Module for parsing DWI-associated files
 */
const normalizeEOL = (str: string): string => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

export function parseBvalBvec(contents: string): string[][] {
  // BVEC files are a matrix of numbers, with each row being
  // a different axis
  // BVAL files are a single row of numbers, and may contain
  // trailing whitespace
  return normalizeEOL(contents)
    .split(/\n/) // Split on newlines
    .filter((x) => x.match(/\S/)) // Remove empty lines
    .map((row) => row.trimEnd().split(/\s+/)) // Split on whitespace, ignoring trailing
}

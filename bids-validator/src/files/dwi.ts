/*
 * DWI
 * Module for parsing DWI-associated files
 */
const normalizeEOL = (str: string): string =>
  str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

export function parseBvalBvec(contents: string): number[][] {
  // BVEC files are a matrix of numbers, with each row being
  // a different axis
  // BVAL files are a single row of numbers, and may contain
  // trailing whitespace
  return normalizeEOL(contents)
    .split(/\s*\n/)
    .filter((x) => x !== '')
    .map((row) =>
      row
        .split(/\s+/)
        .filter((x) => x !== '')
        .map((x) => Number(x)),
    )
}

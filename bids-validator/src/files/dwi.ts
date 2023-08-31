/*
 * DWI
 * Module for parsing DWI-associated files
 */
const normalizeEOL = (str: string): string =>
  str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
// Typescript resolved `row && !/^\s*$/.test(row)` as `string | boolean`
const isContentfulRow = (row: string): boolean => !!(row && !/^\s*$/.test(row))

export function parseBval(contents: string) {
  // BVAL files are a single row of numbers, and may contain
  // trailing whitespace
  return contents
    .split(/\s+/)
    .filter((x) => x !== '')
    .map((x) => Number(x))
}

export function parseBvec(contents: string) {
  // BVEC files are a matrix of numbers, with each row being
  // a different axis
  return normalizeEOL(contents)
    .split('\n')
    .map((row) =>
      row
        .split(/\s+/)
        .filter((x) => x !== '')
        .map((x) => Number(x)),
    )
}

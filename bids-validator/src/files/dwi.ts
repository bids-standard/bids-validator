/*
 * DWI
 * Module for parsing DWI-associated files
 */
const normalizeEOL = (str: string): string =>
  str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

export function parseBval(contents: string): number[][] {
  // BVAL files are a single row of numbers, and may contain
  // trailing whitespace
  return [contents
    .split(/\s+/)
    .filter((x) => x !== '')
    .map((x) => Number(x))]
}

export function parseBvec(contents: string): number[][] {
  // BVEC files are a matrix of numbers, with each row being
  // a different axis
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

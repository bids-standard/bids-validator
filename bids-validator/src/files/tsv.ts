/*
 * TSV
 * Module for parsing TSV
 */

const stripBOM = (str) => str.replace(/^\uFEFF/, '')
const normalizeEOL = (str) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const isContentfulRow = (row) => row && !/^\s*$/.test(row)

export function parseTSV(contents: string) {
  const columns = {}
  contents = stripBOM(contents)
  const rows = normalizeEOL(contents)
    .split('\n')
    .filter(isContentfulRow)
    .map((str) => str.split('\t'))
  const headers = rows.length ? rows[0] : []

  headers.map((x) => (columns[x] = []))
  for (let i = 1; i < rows.length; i++) {
    for (let j = 0; j < headers.length; j++) {
      columns[headers[j]].push(rows[i][j])
    }
  }
  return columns
}

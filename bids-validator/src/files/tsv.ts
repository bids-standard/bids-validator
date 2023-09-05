/*
 * TSV
 * Module for parsing TSV
 */
import { ColumnsMap } from '../types/columns.ts'

const normalizeEOL = (str: string): string =>
  str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
// Typescript resolved `row && !/^\s*$/.test(row)` as `string | boolean`
const isContentfulRow = (row: string): boolean => !!(row && !/^\s*$/.test(row))

export function parseTSV(contents: string) {
  const columns = new ColumnsMap()
  const rows: string[][] = normalizeEOL(contents)
    .split('\n')
    .filter(isContentfulRow)
    .map((str) => str.split('\t'))
  const headers = rows.length ? rows[0] : []

  headers.map((x) => {
    columns[x] = []
  })
  for (let i = 1; i < rows.length; i++) {
    for (let j = 0; j < headers.length; j++) {
      const col = columns[headers[j]] as string[]
      col.push(rows[i][j])
    }
  }
  return columns
}

/*
 * TSV
 * Module for parsing TSV
 */
import { ColumnsMap } from '../types/columns.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { filememoizeAsync } from '../utils/memoize.ts'
import type { WithCache } from '../utils/memoize.ts'

const normalizeEOL = (str: string): string => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
// Typescript resolved `row && !/^\s*$/.test(row)` as `string | boolean`
const isContentfulRow = (row: string): boolean => !!(row && !/^\s*$/.test(row))

async function _loadTSV(file: BIDSFile): Promise<ColumnsMap> {
  return await file.text().then(parseTSV)
}

export const loadTSV = filememoizeAsync(_loadTSV)

function parseTSV(contents: string) {
  const columns = new ColumnsMap()
  const rows: string[][] = normalizeEOL(contents)
    .split('\n')
    .filter(isContentfulRow)
    .map((str) => str.split('\t'))
  const headers = rows.length ? rows[0] : []

  if (rows.some((row) => row.length !== headers.length)) {
    throw { key: 'TSV_EQUAL_ROWS' }
  }

  headers.map((x) => {
    columns[x] = []
  })
  if (headers.length !== Object.keys(columns).length) {
    throw { key: 'TSV_COLUMN_HEADER_DUPLICATE', evidence: headers.join(', ') }
  }
  for (let i = 1; i < rows.length; i++) {
    for (let j = 0; j < headers.length; j++) {
      const col = columns[headers[j]] as string[]
      col.push(rows[i][j])
    }
  }
  return columns
}

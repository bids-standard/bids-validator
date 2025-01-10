/*
 * TSV
 * Module for parsing TSV
 */
import { TextLineStream } from '@std/streams'
import { ColumnsMap } from '../types/columns.ts'
import type { BIDSFile } from '../types/filetree.ts'
import { filememoizeAsync } from '../utils/memoize.ts'
import { createUTF8Stream } from './streams.ts'

async function _loadTSV(file: BIDSFile): Promise<ColumnsMap> {
  const reader = file.stream
    .pipeThrough(createUTF8Stream())
    .pipeThrough(new TextLineStream())
    .getReader()

  try {
    const headerRow = await reader.read()
    const headers = (headerRow.done || !headerRow.value) ? [] : headerRow.value.split('\t')

    // Initialize columns in array for construction efficiency
    const initialCapacity = 1000
    const columns: string[][] = headers.map(() => new Array<string>(initialCapacity))

    let rowIndex = 0 // Keep in scope after loop
    for (; ; rowIndex++) {
      const { done, value } = await reader.read()
      if (done) break

      // Expect a newline at the end of the file, but otherwise error on empty lines
      if (!value) {
        const nextRow = await reader.read()
        if (nextRow.done) break
        throw { key: 'TSV_EMPTY_LINE', line: rowIndex + 2 }
      }

      const values = value.split('\t')
      if (values.length !== headers.length) {
        throw { key: 'TSV_EQUAL_ROWS', line: rowIndex + 2 }
      }
      columns.forEach((column, columnIndex) => {
        // Double array size if we exceed the current capacity
        if (rowIndex >= column.length) {
          column.length = column.length * 2
        }
        column[rowIndex] = values[columnIndex]
      })
    }

    // Construct map, truncating columns to number of rows read
    return new ColumnsMap(
      headers.map((header, index) => [header, columns[index].slice(0, rowIndex)]),
    )
  } finally {
    reader.releaseLock()
  }
}

export const loadTSV = filememoizeAsync(_loadTSV)

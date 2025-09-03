import { asyncBufferFromFile, parquetRead, ParquetReadOptions, ColumnData } from '@hyparquet'
import type { BIDSFile } from '../types/filetree.ts'
import { ColumnsMap } from '../types/columns.ts'
import { createUTF8Stream } from './streams.ts'

export async function loadParquet(file: BIDSFile, maxRows: number = -1): Promise<ColumnsMap> {
  let columnsMap = new ColumnsMap()
  const readOpts: ParquetReadOptions = {
    file: file,
    // @ts-expect-error
    onChunk: (data) => columnsMap[data.columnName] = data.columnData.map(entry => String(entry)), 
  }
  await parquetRead(readOpts)
  return columnsMap
}

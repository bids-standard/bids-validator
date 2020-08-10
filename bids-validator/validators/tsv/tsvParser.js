/*
 * TSV
 * Module for parsing TSV (and eventually other formats)
 */

const trimSplit = separator => str => str.trim().split(separator)
const isContentfulRow = row => row && !/^\s*$/.test(row)

function parseTSV(contents) {
  const content = {
    headers: [],
    rows: [],
  }
  content.rows = trimSplit('\n')(contents)
    .filter(isContentfulRow)
    .map(trimSplit('\t'))
  content.headers = content.rows.length ? content.rows[0] : [] 
  return content
}

export default parseTSV

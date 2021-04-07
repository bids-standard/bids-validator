/*
 * TSV
 * Module for parsing TSV (and eventually other formats)
 */

const normalizeEOL = str =>
  str
    .replace('\r\n', '\n')
    .replace('\r', '\n')
    .replace(/\uFEFF/g, '')
const isContentfulRow = row => row && !/^\s*$/.test(row)

function parseTSV(contents) {
  const content = {
    headers: [],
    rows: [],
  }
  console.log('------------------')
  content.rows = normalizeEOL(contents)
    .split('\n')
    .filter(isContentfulRow)
    .map(str => str.split('\t'))
  console.log(content.rows[0][0][0])
  if (content.rows[0][0][0]) {
    console.log(content.rows[0][0][0].charCodeAt())
  }
  content.headers = content.rows.length ? content.rows[0] : []
  return content
}

export default parseTSV

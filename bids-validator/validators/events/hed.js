const hedValidator = require('hed-validator')
const utils = require('../../utils')
const Issue = utils.issues.Issue

module.exports = function checkHedStrings(events, headers, jsonContents) {
  const issues = []
  // get all headers associated with task data
  const taskHeaders = headers.filter(header => {
    const file = header[0]
    return file.relativePath.includes('_task-')
  })

  // loop through headers with files that are tasks
  taskHeaders.forEach(taskHeader => {
    const file = taskHeader[0]

    // get the json sidecar dictionary associated with that nifti scan
    const potentialSidecars = utils.files.potentialLocations(
      file.relativePath.replace('.gz', '').replace('.nii', '.json'),
    )
    const mergedDictionary = utils.files.generateMergedSidecarDict(
      potentialSidecars,
      jsonContents,
    )
    const sidecarHedTags = {}

    for (let sidecarKey in mergedDictionary) {
      const sidecarValue = mergedDictionary[sidecarKey]
      if (sidecarValue.HED !== undefined) {
        sidecarHedTags[sidecarKey] = sidecarValue.HED
      }
    }

    // get the _events.tsv associated with this task scan
    const potentialEvents = utils.files.potentialLocations(
      file.relativePath.replace('.gz', '').replace('bold.nii', 'events.tsv'),
    )
    const associatedEvents = events.filter(
      event => potentialEvents.indexOf(event.path) > -1,
    )

    // loop through all events associated with this task scan
    for (let event of associatedEvents) {
      // get all non-empty rows
      const rows = event.contents
        .split('\n')
        .filter(row => !(!row || /^\s*$/.test(row)))

      const columnHeaders = rows[0].trim().split('\t')
      const hedColumnIndex = columnHeaders.indexOf('HED')
      const sidecarHedColumnIndices = {}
      for (let sidecarHedColumn in sidecarHedTags) {
        const sidecarHedColumnHeader = columnHeaders.indexOf(sidecarHedColumn)
        if (sidecarHedColumnHeader > -1) {
          sidecarHedColumnIndices[sidecarHedColumn] = sidecarHedColumnHeader
        }
      }
      if (hedColumnIndex === -1 && sidecarHedColumnIndices.length === 0) {
        continue
      }

      for (let row of rows.slice(1)) {
        // get the 'HED' field
        const rowCells = row.trim().split('\t')
        let hedString = rowCells[hedColumnIndex]
        for (let sidecarHedColumn in sidecarHedColumnIndices) {
          const sidecarHedIndex = sidecarHedColumnIndices[sidecarHedColumn]
          const sidecarHedKey = rowCells[sidecarHedIndex]
          if (sidecarHedKey) {
            hedString += ',' + sidecarHedTags[sidecarHedColumn][sidecarHedKey]
          }
        }

        const hedIssues = []
        const isHedStringValid = hedValidator.HED.validateHedString(
          hedString,
          hedIssues,
        )
        if (!isHedStringValid) {
          issues.push(
            new Issue({
              file: event.file,
              code: 999,
            }),
          )
        }
      }
    }
  })
  return issues
}

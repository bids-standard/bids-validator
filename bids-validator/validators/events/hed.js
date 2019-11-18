import hedValidator from 'hed-validator'
import utils from '../../utils'
const Issue = utils.issues.Issue

export default function checkHedStrings(events, headers, jsonContents) {
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
        const hedStringParts = []
        if (rowCells[hedColumnIndex]) {
          hedStringParts.push(rowCells[hedColumnIndex])
        }
        for (let sidecarHedColumn in sidecarHedColumnIndices) {
          const sidecarHedIndex = sidecarHedColumnIndices[sidecarHedColumn]
          const sidecarHedKey = rowCells[sidecarHedIndex]
          if (sidecarHedKey) {
            const sidecarHedString =
              sidecarHedTags[sidecarHedColumn][sidecarHedKey]
            if (sidecarHedString !== undefined) {
              hedStringParts.push(sidecarHedString)
            } else {
              issues.push(
                new Issue({
                  code: 112,
                  file: file,
                  evidence: sidecarHedKey,
                }),
              )
            }
          }
        }

        if (hedStringParts.length === 0) {
          continue
        }
        const hedString = hedStringParts.join(',')

        const hedIssues = []
        const isHedStringValid = hedValidator.HED.validateHedString(
          hedString,
          hedIssues,
          true,
        )
        if (!isHedStringValid) {
          const convertedIssues = convertHedIssuesToBidsIssues(hedIssues, file)
          for (let convertedIssue of convertedIssues) {
            issues.push(convertedIssue)
          }
        }
      }
    }
  })
  return issues
}

function convertHedIssuesToBidsIssues(hedIssues, file) {
  const hedIssuesToBidsCodes = {
    'ERROR: Invalid character': 106,
    'ERROR: Comma missing after': 108,
    'WARNING: First word not capitalized or camel case': 109,
    'ERROR: Duplicate tag': 110,
    'ERROR: Too many tildes': 111,
  }

  const convertedIssues = []
  for (let hedIssue of hedIssues) {
    if (
      hedIssue.startsWith(
        'ERROR: Number of opening and closing parentheses are unequal.',
      )
    ) {
      convertedIssues.push(
        new Issue({
          code: 107,
          file: file,
        }),
      )
    } else {
      const issueParts = hedIssue.split(' - ')
      const bidsIssueCode = hedIssuesToBidsCodes[issueParts[0]]
      if (bidsIssueCode === undefined) {
        if (hedIssue.startsWith('WARNING')) {
          convertedIssues.push(
            new Issue({
              code: 105,
              file: file,
              evidence: issueParts[1],
            }),
          )
        } else {
          convertedIssues.push(
            new Issue({
              code: 104,
              file: file,
              evidence: issueParts[1],
            }),
          )
        }
      } else {
        convertedIssues.push(
          new Issue({
            code: bidsIssueCode,
            file: file,
            evidence: issueParts[1],
          }),
        )
      }
    }
  }

  return convertedIssues
}

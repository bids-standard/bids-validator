/**
 * Go from tsv format string with participant_id as a required header to object of form
 * {
 *   participant_id_1: {
 *     foo: 'x',
 *     ...
 *   },
 *   participant_id_2: {
 *     foo: 'y',
 *     ...
 *   }
 *   ...
 * }
 *
 * returns null if participant_id is not a header or file contents do not exist
 * @param {string} participantsTsvContent
 */
const collectSubjectMetadata = participantsTsvContent => {
  if (participantsTsvContent) {
    const contentTable = participantsTsvContent
      .split('\n')
      .filter(row => row !== '')
      .map(row => row.split('\t'))
    const [headers, ...subjectData] = contentTable
    const participant_idIndex = headers.findIndex(
      header => header === 'participant_id',
    )
    if (participant_idIndex === -1) return null
    else
      return subjectData.reduce(
        (subjectMetadata, data) => ({
          ...subjectMetadata,
          [data[participant_idIndex].replace(/^sub-/, '')]: data.reduce(
            (subjectMetadata, datum, i) =>
              i === participant_idIndex
                ? subjectMetadata
                : {
                    ...subjectMetadata,
                    [headers[i]]:
                      headers[i] === 'age' ? parseInt(datum) : datum,
                  },
            {},
          ),
        }),
        {},
      )
  }
}

module.exports = collectSubjectMetadata

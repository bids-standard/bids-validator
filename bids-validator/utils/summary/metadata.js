function Metadata(defaultData = {}) {
  Object.entries(defaultData).forEach(([key, value]) => this.add(key, value))
}

Metadata.prototype.collectFromSummary = function(summary) {
  this.add('subjectCount', summary.subjects.length)
  this.add('modalities', summary.modalities)
}

Metadata.prototype.collectFromDescription = function(description) {
  if (typeof description === 'object') {
    this.add('datasetName', description.Name)
    this.add('seniorAuthor', description.Authors && description.Authors[0])
    this.add('openneuroPaperDOI', description.DatasetDOI)
  }
}

Metadata.prototype.collectFromFiles = function(files) {
  const hasDerivatives = checkForDerivatives(files)
  this.add('dataProcessed', hasDerivatives)
}

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
const generateParticipantsMetadata = (headers, subjectData) => {
  const participant_idIndex = headers.findIndex(header => header === 'participant_id')
  if(participant_idIndex === -1) return null
  else return subjectData.reduce((participantsMetadata, data) => ({
    ...participantsMetadata,
    [data[participant_idIndex]]: data.reduce((subjectMetadata, datum, i) => (i === participant_idIndex
      ? subjectMetadata
      : {
        ...subjectMetadata,
        [headers[i]]: headers[i] === 'age' ? parseInt(datum) : datum
      }  
      ), {})
    }), {})
  }
  
  /**
   * Generates string of form "[min]-[max]", eg. '21-42'
   * @param {string} participantsMetadata 
   */
  const getAgeRange = (participantsMetadata) => {
    let min, max
    Object.values(participantsMetadata)
      .filter(participant => exists(participant.age))
      .forEach(({ age }, i) => {
        if(i === 0) min = max = age
        else if(age > max) max = age
        else if(age < min) min = age
      })
    return `${min}-${max}`
  }
  
  Metadata.prototype.collectFromParticipants = function(participantsTsvContent) {
    let participantsMetadata = null
    if(participantsTsvContent) {
      const contentTable = participantsTsvContent
        .split('\n')
        .filter(row => row !== '')
        .map(row => row.split('\t'))
      const [headers, ...subjectData] = contentTable
      
      participantsMetadata = generateParticipantsMetadata(headers, subjectData)
      
      const ageRange = getAgeRange(participantsMetadata)
      this.add('age', ageRange)
    }
    return participantsMetadata
  }

Metadata.prototype.add = function(key, value) {
  if (key && exists(value)) this[key] = value
}

function exists(value) {
  return value !== undefined && value !== null
}

const derivativesFilePattern = /^\/derivatives\/\w+re/

function checkForDerivatives(files) {
  return (
    Object.values(files).findIndex(file =>
      derivativesFilePattern.test(file.relativePath),
    ) !== -1
  )
}

module.exports = Metadata
/** METADATA **/

// /* not intrinsic to data; get from form */
// associatedPaperDOI
// species
// studyLongitudinal
// studyDomain
// trialCount // are trials equivalent to tasks?
// notes

// /* not sure if extractable */

// /* can get from openneuro */
// datasetId
// datasetUrl
// firstSnapshotCreatedAt
// latestSnapshotCreatedAt
// adminUsers

// /* still need to extract from validator */
// age // participants tsv
// tasksCompleted // if no tasks exist, n/a? // note: point users to docs

// /* extractable from summary */
// subjectCount
// modalities

// /* extractable from description */
// datasetName
// seniorAuthor

// /* extractable from files */
// dataProcessed

// /* ASK FRANKLIN */
// studyDesign // anything to do with events
// openneuroPaperDOI
// dxStatus // diagnosis?

function Metadata(defaultData = {}) {
  Object.entries(defaultData).forEach(([key, value]) => this.add(key, value))
}

const isEmptyArray = thing => Array.isArray(thing) && thing.length === 0
Metadata.prototype.collectFromSummary = function(summary) {
  this.add('modalities', summary.modalities)
  this.add('tasksCompleted', isEmptyArray(summary.tasks) ? 'n/a' : null)
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
const generateSubjectMetadata = participantsTsvContent => {
  if(participantsTsvContent) {
    const contentTable = participantsTsvContent
      .split('\n')
      .filter(row => row !== '')
      .map(row => row.split('\t'))
    const [headers, ...subjectData] = contentTable
  const participant_idIndex = headers.findIndex(header => header === 'participant_id')
  if(participant_idIndex === -1) return null
  else return subjectData.reduce((subjectMetadata, data) => ({
    ...subjectMetadata,
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
   * @param {string} subjectMetadata 
   */
  const getAgeRange = (subjectMetadata) => Object.values(subjectMetadata)
      .filter(participant => exists(participant.age))
      .map(({ age }) => age)
      .sort((a, b) => a - b)
  
  Metadata.prototype.collectFromParticipants = function(participantsTsvContent) {
    let subjectMetadata = null
    if(participantsTsvContent) {
      const contentTable = participantsTsvContent
        .split('\n')
        .filter(row => row !== '')
        .map(row => row.split('\t'))
      const [headers, ...subjectData] = contentTable
      
      subjectMetadata = generateSubjectMetadata(headers, subjectData)
      
      const ageRange = getAgeRange(subjectMetadata)
      this.add('ages', ageRange)
    }
    return subjectMetadata
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

// /* ASK FRANKLIN */
// studyDesign // anything to do with events
// openneuroPaperDOI
// dxStatus // diagnosis?

// /* not sure if extractable */

// /* can get from openneuro */
// datasetId
// datasetUrl
// firstSnapshotCreatedAt
// latestSnapshotCreatedAt
// adminUsers

// /* still need to extract from validator */
// none?

// /* extractable from summary */
// subjectCount
// modalities

// /* extractable from description */
// datasetName
// seniorAuthor

// /* extractable from files */
// dataProcessed

// /* extractable from participants.tsv */
// ages // participants tsv
// tasksCompleted // if no tasks exist, n/a? // note: point users to docs

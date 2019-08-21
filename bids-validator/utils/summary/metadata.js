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

/* not intrinsic to data; get from form */
// associatedPaperDOI
// ages
// species
// studyLongitudinal
// notes

/* not sure if extractable */
// dxStatus
// trialCount // are trials equivalent to tasks?
// tasksCompleted
// studyDesign
// studyDomain

/* can get from openneuro */
// datasetId
// datasetUrl
// firstSnapshotCreatedAt
// latestSnapshotCreatedAt
// adminUsers

/* extractable from summary */
// subjectCount
// modalities

/* extractable from description */
// datasetName
// seniorAuthor
// openneuroPaperDOI

/* extractable from files */
// dataProcessed

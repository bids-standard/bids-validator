function Metadata(defaultData = {}) {
  Object.entries(defaultData).forEach(([key, value]) => this.add(key, value))
}

Metadata.prototype.collectFromSummary = function(summary) {
  if (typeof summary === 'object') {
    this.add('subjectCount', summary.subjects.length)
    this.add('modalities', summary.modalities)
  }
}

Metadata.prototype.collectFromDescription = function(description) {
  if (typeof description === 'object') {
    this.add('datasetName', description.Name)
    this.add('seniorAuthor', description.Authors && description.Authors[0])
    this.add('openneuroPaperDOI', description.DatasetDOI)
  }
}

Metadata.prototype.add = function(key, value) {
  if (key && value) this[key] = value
}

module.exports = new Metadata()
/** METADATA **/
/* openneuro specific */
// datasetId: 'ID!',
// datasetUrl: 'String',
// firstSnapshotCreatedAt: 'DateTime',
// latestSnapshotCreatedAt: 'DateTime',
// adminUsers: null, //'String'
//
/* not intrinsic to data */
// associatedPaperDOI: null, //'String'
// ages: null, //'String'
// species: null, //'String',
// studyLongitudinal: null, //'String'
// notes: null, //'String'
//
/* extractable from summary */
// subjectCount: null, //'Int'
// modalities: null, //'[String]'
//
/* extractable from description
// datasetName: null, //'String'
// seniorAuthor: null, //'PersonNameInput'
// openneuroPaperDOI: null, //'String'
//
/* not sure if extractable */
// dataProcessed: null, //'String'
// trialCount: null, //'Int'
// dxStatus: null, //'[String]'
// tasksCompleted: null, //'Boolean'
// studyDesign: null, //'String'
// studyDomain: null, //'String'

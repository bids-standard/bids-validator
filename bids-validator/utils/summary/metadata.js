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

module.exports = Metadata

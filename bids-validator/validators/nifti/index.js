const nifti = require('./nii')
const duplicateFiles = require('./duplicateFiles')
const fieldmapWithoutMagnitude = require('./fieldmapWithoutMagnitude')
const phasediffWithoutMagnitude = require('./phasediffWithoutMagnitude')
const validate = require('./validate')

module.exports = {
  nifti,
  duplicateFiles,
  fieldmapWithoutMagnitude,
  phasediffWithoutMagnitude,
  validate,
}

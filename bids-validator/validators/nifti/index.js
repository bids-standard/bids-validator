import nifti from './nii'
import duplicateFiles from './duplicateFiles'
import fieldmapWithoutMagnitude from './fieldmapWithoutMagnitude'
import phasediffWithoutMagnitude from './phasediffWithoutMagnitude'
import validate from './validate'

export const NIFTI = nifti

export default {
  nifti,
  duplicateFiles,
  fieldmapWithoutMagnitude,
  phasediffWithoutMagnitude,
  validate,
}

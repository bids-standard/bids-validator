import type from '../type'

export const collect = filenames => {
  const modalities = {
    MRI: 0,
    PET: 0,
    MEG: 0,
    EEG: 0,
    iEEG: 0,
  }
  for (const path of filenames) {
    // MRI files
    if (
      type.file.isAnat(path) ||
      type.file.isDWI(path) ||
      type.file.isFieldMap(path) ||
      type.file.isFuncBold(path)
    ) {
      modalities['MRI']++
    }
    if (type.file.isPET(path) || type.file.isPETBlood(path)) {
      modalities['PET']++
    }
    if (type.file.isMeg(path)) {
      modalities['MEG']++
    }
    if (type.file.isEEG(path)) {
      modalities['EEG']++
    }
    if (type.file.isIEEG(path)) {
      modalities['iEEG']++
    }
  }
  // Order by matching file count
  const nonZero = Object.keys(modalities).filter(a => modalities[a] !== 0)
  if (nonZero.length === 0) {
    return []
  }
  return nonZero.sort((a, b) => {
    if (modalities[b] === modalities[a]) {
      // On a tie, hand it to the non-MRI modality
      if (b === 'MRI') {
        return -1
      } else {
        return 0
      }
    }
    return modalities[b] - modalities[a]
  })
}

// Preserve the old fileList signature
const collectModalities = fileList => {
  const keys = Object.keys(fileList).map(file => fileList[file].relativePath)
  return collect(keys)
}

export default collectModalities

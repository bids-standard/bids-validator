import type from '../type'

const collectModalities = fileList => {
  const modalities = []
  const keys = Object.keys(fileList)
  keys.forEach(key => {
    const file = fileList[key]
    const path = file.relativePath
    const pathParts = path.split('_')
    const suffix = pathParts[pathParts.length - 1]

    // check modality by data file extension ...
    // and capture data files for later sanity checks (when available)
    if (type.file.hasModality(file.relativePath)) {
      // collect modality summary
      const modality = suffix.slice(0, suffix.indexOf('.'))
      if (modalities.indexOf(modality) === -1) {
        modalities.push(modality)
      }
    }
  })
  return modalities
}

export default collectModalities

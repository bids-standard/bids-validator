/**
 * Generate Merged Sidecar Dictionary
 *
 * Takes an array of potential sidecards and a
 * master object dictionary of all JSON file
 * content and returns a merged dictionary
 * containing all values from the potential
 * sidecars.
 */
function generateMergedSidecarDict(potentialSidecars, jsonContents) {
  // Use a map to avoid potential conflicts with keys in Object.prototype
  const mergedDictionary = new Map()
  let valid = true
  potentialSidecars.map((sidecarName) => {
    const jsonObject = jsonContents[sidecarName]
    if (jsonObject) {
      for (const key of Object.keys(jsonObject)) {
        if (jsonObject.hasOwnProperty(key)) {
          mergedDictionary.set(key, jsonObject[key])
        }
      }
    } else if (jsonObject === null) {
      valid = false
    }
  })
  const mergedDictionaryObj = Object.fromEntries(mergedDictionary)
  if (!valid) {
    mergedDictionaryObj.invalid = true
  }
  return mergedDictionaryObj
}

export default generateMergedSidecarDict

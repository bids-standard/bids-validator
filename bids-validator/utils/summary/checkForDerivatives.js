const derivativesFilePattern = /^\/derivatives\/\w+re/

module.exports = function checkForDerivatives(files) {
  return (
    Object.values(files).findIndex(file =>
      derivativesFilePattern.test(file.relativePath),
    ) !== -1
  )
}

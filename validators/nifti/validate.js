const utils = require('../../utils')
const nifti = require('./nii')

const validate = (
  files,
  fileList,
  options,
  jsonContentsDict,
  bContentsDict,
  events,
  headers,
  issues,
) => {
  const niftiPromises = files.map(file => {
    return new Promise(resolve => {
      if (options.ignoreNiftiHeaders) {
        nifti(
          null,
          file,
          jsonContentsDict,
          bContentsDict,
          fileList,
          events,
          function(niftiIssues) {
            issues = issues.concat(niftiIssues)
            resolve()
          },
        )
      } else {
        utils.files.readNiftiHeader(file, function(header) {
          // check if header could be read
          if (header && header.hasOwnProperty('error')) {
            issues.push(header.error)
            resolve()
          } else {
            headers.push([file, header])
            nifti(
              header,
              file,
              jsonContentsDict,
              bContentsDict,
              fileList,
              events,
              function(niftiIssues) {
                issues = issues.concat(niftiIssues)
                resolve()
              },
            )
          }
        })
      }
    })
  })

  return Promise.all(niftiPromises)
}

module.exports = validate

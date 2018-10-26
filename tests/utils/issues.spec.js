const assert = require('assert')
const utils = require('../../utils')
const dir = process.cwd()
const data_dir = dir + '/../bids-examples/'
const test_data = data_dir + 'BIDS_test/'

describe('exceptionHandler', () => {
  let testErr, issueList, summary, options, formattedIssues

  beforeAll(() => {
    testErr = new Error('oh no')
    issueList = []
    summary = {
      sessions: [],
      subjects: [],
      tasks: [],
      modalities: [],
      totalFiles: 0,
      size: 0,
    }
    options = {
      ignoreWarnings: false,
      ignoreNiftiHeaders: false,
      verbose: false,
      bep006: false,
      bep010: false,
      config: {},
    }
    formattedIssues = utils.issues.exceptionHandler(testErr, issueList, summary, options)
  })
  
  it('adds INTERNAL ERROR to the issues.errors list', () => {
    assert.equal(formattedIssues.errors[0].key, 'INTERNAL ERROR')
  })

  it('creates a properly formatted issue in the error\'s files property', () => {
    const exceptionIssue = formattedIssues.errors[0].files[0]
    assert.ok(utils.issues.isAnIssue(exceptionIssue))
  })

  it('gives a reason for the error', () => {
    const exceptionIssue = formattedIssues.errors[0].files[0]
    assert.equal(exceptionIssue.reason, `${testErr.message}; please help the BIDS team and community by opening an issue at (https://github.com/bids-standard/bids-validator/issues) with the evidence here.`)
  })
})
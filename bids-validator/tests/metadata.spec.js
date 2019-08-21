/**
 * eslint no-console: ["error", { allow: ["log"] }]
 * @jest-environment ./bids-validator/tests/env/ExamplesEnvironment.js
 */

const { assert } = require('chai')
const { createFileList } = require('./env/FileList.js')
const Metadata = require('../utils/summary/metadata')
const validate = (dir, options) =>
  new Promise(resolve =>
    require('../index.js').BIDS(dir, options, (...args) => {
      const [issues, summary] = args
      resolve({ issues, summary })
    }),
  )

const dataDirectory = 'bids-validator/tests/data/'
const validDataset = `valid_dataset/`

const createDatasetFileList = path => {
  const testDatasetPath = `${dataDirectory}${path}`
  return global.jsdom ? createFileList(testDatasetPath) : testDatasetPath
}

describe('dataset metadata', () => {
  it('exists', done => {
    const dir = createDatasetFileList(validDataset)
    const options = {}
    validate(dir, options).then(({ summary }) => {
      assert(summary && summary.metadata)
      done()
    })
  })
  it('collects metadata from summary', () => {
    const summary = {
      sessions: [ '01', '02' ],
      subjects: [ '01', '02', '03', '04', '05' ],
      tasks: [],
      modalities: [ 'T1w', 'bold', 'physio', 'stim' ],
      totalFiles: 113,
      size: 471348,
      metadata: new Metadata(),
    }
    summary.metadata.collectFromSummary(summary)
    assert.strictEqual(summary.metadata.subjectCount, summary.subjects.length)
  })
  it('ignores nonexistant or missing data', () => {
    const metadata = new Metadata()
    const description = {
      Name: 'bob ross',
      seniorAuthor: [],
    }
    metadata.collectFromDescription(description)
    expect(metadata).toEqual({ datasetName: description.Name })
  })
})

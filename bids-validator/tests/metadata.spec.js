/**
 * eslint no-console: ["error", { allow: ["log"] }]
 * @jest-environment ./bids-validator/tests/env/ExamplesEnvironment.js
 */

const { assert } = require('chai')
const fs = require('fs')
const path = require('path')
const { createFileList } = require('./env/FileList.js')

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
})

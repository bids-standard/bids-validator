/**
 * eslint no-console: ["error", { allow: ["log"] }]
 * @jest-environment ./bids-validator/tests/env/ExamplesEnvironment.js
 */

const { assert } = require('chai')
const { createFileList } = require('../env/FileList.js')
const Metadata = require('../../utils/summary/metadata')
const validate = (dir, options) =>
  new Promise(resolve =>
    require('../../index.js').BIDS(dir, options, (...args) => {
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
      sessions: ['01', '02'],
      subjects: ['01', '02', '03', '04', '05'],
      tasks: [],
      modalities: ['T1w', 'bold', 'physio', 'stim'],
      totalFiles: 113,
      size: 471348,
      metadata: new Metadata(),
    }
    summary.metadata.collectFromSummary(summary)
    assert.strictEqual(summary.metadata.subjectCount, summary.subjects.length)
  })

  it("sets tasksCompleted to 'n/a' if validator finds no tasks", () => {
    const summary = {
      tasks: [],
    }
    const metadata = new Metadata()
    metadata.collectFromSummary(summary)
    assert.strictEqual(metadata.tasksCompleted, 'n/a')
  })

  it('does not save tasksCompleted field if tasks exist', () => {
    const summary = {
      tasks: ['a task', 'or two'],
    }
    const metadata = new Metadata()
    metadata.collectFromSummary(summary)
    expect(metadata).not.toHaveProperty('tasksCompleted')
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

  it('captures metadata from files', done => {
    const dir = createDatasetFileList(validDataset)
    const options = {}
    validate(dir, options).then(({ summary }) => {
      // bids-validator/tests/data/valid_dataset/ does have derivatives
      assert.strictEqual(summary.metadata.dataProcessed, true)
      done()
    })
  })

  it('extracts participants metadata from participants.tsv', () => {
    const participantsTsv = [
      ['participant_id', 'age', 'sex', 'group'],
      ['sub-01', '24', 'M', 'control'],
      ['sub-02', '12', 'F', 'control'],
      ['sub-patient-01', '33', 'F', 'patient'],
    ]
      .map(row => row.join('\t'))
      .join('\n')

    const metadata = new Metadata()
    const participantsMetadata = metadata.collectFromParticipants(
      participantsTsv,
    )

    expect(metadata.age).toStrictEqual('12-33')
    expect(participantsMetadata).toEqual({
      'sub-01': {
        age: 24,
        sex: 'M',
        group: 'control',
      },
      'sub-02': {
        age: 12,
        sex: 'F',
        group: 'control',
      },
      'sub-patient-01': {
        age: 33,
        sex: 'F',
        group: 'patient',
      },
    })
  })
})

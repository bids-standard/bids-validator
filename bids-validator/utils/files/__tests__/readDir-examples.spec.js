/**
 * @jest-environment ./bids-validator/tests/env/ExamplesEnvironment.js
 */
const readDir = require('../readDir.js').default

describe('readDir.js - examples integration', () => {
  describe('readDir()', () => {
    it('returns expected files', async done => {
      readDir('bids-validator/tests/data/bids-examples-1.2.0/ds002/').then(
        files => {
          expect(Object.keys(files)).toHaveLength(245)
          expect(files[0].name).toBe('CHANGES')
          expect(files[25].name).toBe(
            'sub-02_task-mixedeventrelatedprobe_run-01_events.tsv',
          )
          expect(files[200].name).toBe('sub-15_T1w.nii.gz')
          done()
        },
      )
    })
    it('correctly follows symlinks for subjects with followSymbolicLink: true', async done => {
      readDir('bids-validator/tests/data/symlinked_subject', {
        ignoreSymlinks: false,
      }).then(files => {
        expect(Object.keys(files)).toHaveLength(12)
        expect(Object.values(files).map(f => f.name)).toEqual([
          'CHANGES',
          'README',
          'dataset_description.json',
          'participants.tsv',
          'sub-01_T1w.nii',
          'sub-01_T1w.nii.gz',
          'sub-0-1_task-rhymejudgment_bold.nii.gz',
          'sub-01_task-rhyme-judgment_bold.nii.gz',
          'sub-01_task-rhyme-judgment_events.tsv',
          'sub-01_task-rhyme_judgment_bold.nii.gz',
          'sub-01_task-rhyme_judgment_events.tsv',
          'task-rhymejudgment_bold.json',
        ])
        done()
      })
    })
    it('correctly does not follow symlinks for subjects with followSymbolicLink: false', async done => {
      readDir('bids-validator/tests/data/symlinked_subject', {
        ignoreSymlinks: true,
      }).then(files => {
        expect(Object.keys(files)).toHaveLength(6)
        expect(Object.values(files).map(f => f.name)).toEqual([
          'CHANGES',
          'README',
          'dataset_description.json',
          'participants.tsv',
          'sub-01',
          'task-rhymejudgment_bold.json',
        ])
        done()
      })
    })
    it('returns file objects with the expected shape', async done => {
      readDir('bids-validator/tests/data/symlinked_subject', {
        ignoreSymlinks: true,
      }).then(files => {
        expect(Object.keys(files)).toHaveLength(6)
        Object.values(files).forEach(f => {
          expect(Object.getOwnPropertyNames(f)).toEqual([
            'name',
            'path',
            'relativePath',
          ])
        })
        done()
      })
    })
  })
})

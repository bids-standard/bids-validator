const readDir = require('../readDir.js')

describe('readDir.js', () => {
  describe('getFiles()', () => {
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
  })
})

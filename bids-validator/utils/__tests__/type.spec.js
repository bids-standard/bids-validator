import type from '../type.js'

describe('type.js', () => {
  describe('isBids()', () => {
    it('does not throw an error for valid defacemask filenames', () => {
      expect(
        type.isBIDS(
          '/sub-rid000043/anat/sub-rid000043_run-02_mod-T1w_defacemask.nii.gz',
        ),
      ).toBe(true)
    })

    it('does not throw an error for recording entity in physio data', () => {
      expect(
        type.isBIDS(
          '/sub-05/eeg/sub-05_task-matchingpennies_recording-eyetracking_physio.tsv.gz',
        ),
      ).toBe(true)
    })
  })
})

import { schemaRegex } from '../../src/schemaTypes.js'
import type, { schemaSetup } from '../type.js'

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

    it('does not throw an error for recording entity in physio data at root of the dataset', () => {
      expect(
        type.isBIDS('/task-matchingpennies_recording-eyetracking_physio.json'),
      ).toBe(true)
    })

    const physio_task_modalities = ['eeg', 'ieeg', 'meg', 'func', 'beh']
    physio_task_modalities.map(mod => {
      it(`does not throw an error for recording entity in ${mod} physio data`, () => {
        expect(
          type.isBIDS(
            `/sub-05/${mod}/sub-05_task-matchingpennies_recording-eyetracking_physio.tsv.gz`,
          ),
        ).toBe(true)
      })
    })
  })
  describe('schema mode tests', () => {
    beforeAll(async () => {
      const schema = await schemaRegex('v1.6.0', { local: true })
      schemaSetup(schema)
    })
    afterAll(() => {
      schemaSetup()
    })
    describe('isAnat()', () => {
      it('does not throw an error when matching basic anat data files', () => {
        expect(type.file.isAnat('/sub-01/anat/sub-01_T1w.nii.gz')).toBe(true)
      })
    })
    describe('isBIDS()', () => {
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

      it('does not throw an error for recording entity in physio data at root of the dataset', () => {
        expect(
          type.isBIDS(
            '/task-matchingpennies_recording-eyetracking_physio.json',
          ),
        ).toBe(true)
      })
    })
  })
})

import {
  ds000247,
  ds001421,
  ds001734,
  ds002718,
  ds003400,
} from '../../../tests/data/collectModalities-data'
import { collect } from '../collectModalities'

describe('collectModalities()', () => {
  it('returns correct values for a PET dataset', () => {
    expect(collect(ds001421)).toEqual(['PET', 'MRI'])
  })
  it('returns correct values for an MRI dataset', () => {
    expect(collect(ds001734)).toEqual(['MRI'])
  })
  it('returns correct values for an EEG dataset', () => {
    expect(collect(ds002718)).toEqual(['EEG', 'MRI'])
  })
  it('returns correct values for an iEEG dataset', () => {
    expect(collect(ds003400)).toEqual(['iEEG'])
  })
  it('returns correct values for an MEG dataset', () => {
    expect(collect(ds000247)).toEqual(['MEG', 'MRI'])
  })
  it('sorts other modalities ahead of MRI on ties', () => {
    const tied = [
      '/sub-01/ses-02/pet/sub-01_ses-02_pet.nii.gz',
      '/sub-01/ses-02/anat/sub-01_ses-02_T1w.nii',
    ]
    expect(collect(tied)).toEqual(['PET', 'MRI'])
  })
})

import {
  ds000247,
  ds001421,
  ds001734,
  ds002718,
  ds003400,
} from '../../../tests/data/collectModalities-data'
import { collectModalities } from '../collectModalities'

describe('collectModalities()', () => {
  it('returns correct values for a PET dataset', () => {
    expect(collectModalities(ds001421)).toEqual({
      primary: ['PET', 'MRI'],
      secondary: ['MRI_Structural'],
    })
  })
  it('returns correct values for an MRI dataset', () => {
    expect(collectModalities(ds001734)).toEqual({
      primary: ['MRI'],
      secondary: ['MRI_Functional', 'MRI_Structural'],
    })
  })
  it('returns correct values for an EEG dataset', () => {
    expect(collectModalities(ds002718)).toEqual({
      primary: ['EEG', 'MRI'],
      secondary: ['MRI_Structural'],
    })
  })
  it('returns correct values for an iEEG dataset', () => {
    expect(collectModalities(ds003400)).toEqual({
      primary: ['iEEG'],
      secondary: [],
    })
  })
  it('returns correct values for an MEG dataset', () => {
    expect(collectModalities(ds000247)).toEqual({
      primary: ['MEG', 'MRI'],
      secondary: ['MRI_Structural'],
    })
  })
  it('sorts other modalities ahead of MRI on ties', () => {
    const tied = [
      '/sub-01/ses-02/pet/sub-01_ses-02_pet.nii.gz',
      '/sub-01/ses-02/anat/sub-01_ses-02_T1w.nii',
    ]
    expect(collectModalities(tied)).toEqual({
      primary: ['PET', 'MRI'],
      secondary: ['MRI_Structural'],
    })
  })
  it('returns empty arrays when no matches are found', () => {
    expect(collectModalities([])).toEqual({
      primary: [],
      secondary: [],
    })
  })
})

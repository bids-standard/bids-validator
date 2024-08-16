import { pathsToTree } from '../files/filetree.ts'

export const simpleDataset = pathsToTree([
  '/dataset_description.json',
  '/README',
  '/CHANGES',
  '/participants.tsv',
  '/sub-01/anat/sub-01_T1w.nii.gz',
])

export const simpleDatasetFileCount = 5

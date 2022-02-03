import { FileTree } from '../files/filetree.ts'

// Very basic dataset modeled for tests
const rootFileTree = new FileTree('/', '')
const subjectFileTree = new FileTree('/sub-01', 'sub-01', rootFileTree)
const anatFileTree = new FileTree('/sub-01/anat', 'anat', subjectFileTree)
anatFileTree.files = [{ name: 'sub-01_T1w.nii.gz', size: BigInt(311112) }]
subjectFileTree.files = []
subjectFileTree.directories = [anatFileTree]
rootFileTree.files = [
  { name: 'dataset_description.json', size: BigInt(240) },
  { name: 'README', size: BigInt(709) },
  { name: 'CHANGES', size: BigInt(39) },
  { name: 'participants.tsv', size: BigInt(36) },
]
rootFileTree.directories = [subjectFileTree]

export const simpleDataset = rootFileTree

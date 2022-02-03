// Very basic dataset modeled for tests
const rootFileTree = new FileTree('/')
const subjectFileTree = new FileTree('/sub-01')
const anatFileTree = new FileTree('/sub-01/anat')
anatFileTree.files = [{ name: 'sub-01_T1w.nii.gz', size: 311112 }]
subjectFileTree.files = []
subjectFileTree.directories = [anatFileTree]
rootFileTree.files = [
  { name: 'dataset_description.json', size: 240 },
  { name: 'README', size: 709 },
  { name: 'CHANGES', size: 39 },
  { name: 'participants.tsv', size: 36 },
]
rootFileTree.directories = [subjectFileTree]

export const simpleDataset = rootFileTree

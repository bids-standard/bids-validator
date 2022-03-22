import { FileTree, BIDSFile } from '../files/filetree.ts'
import { BIDSFileDeno } from '../files/deno.ts'

// Very basic dataset modeled for tests
const rootFileTree = new FileTree('/', '')
const subjectFileTree = new FileTree('/sub-01', 'sub-01', rootFileTree)
const anatFileTree = new FileTree('/sub-01/anat', 'anat', subjectFileTree)
anatFileTree.files = [
  {
    name: 'sub-01_T1w.nii.gz',
    size: Promise.resolve(311112),
    ignored: false,
    stream: Promise.resolve(new ReadableStream()),
  },
]
subjectFileTree.files = []
subjectFileTree.directories = [anatFileTree]
rootFileTree.files = [
  {
    name: 'dataset_description.json',
    size: Promise.resolve(240),
    ignored: false,
    stream: Promise.resolve(new ReadableStream()),
  },
  {
    name: 'README',
    size: Promise.resolve(709),
    ignored: false,
    stream: Promise.resolve(new ReadableStream()),
  },
  {
    name: 'CHANGES',
    size: Promise.resolve(39),
    ignored: false,
    stream: Promise.resolve(new ReadableStream()),
  },
  {
    name: 'participants.tsv',
    size: Promise.resolve(36),
    ignored: false,
    stream: Promise.resolve(new ReadableStream()),
  },
]
rootFileTree.directories = [subjectFileTree]

export const simpleDataset = rootFileTree

export const simpleDatasetFileCount = 5

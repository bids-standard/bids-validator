import { FileTree } from '../types/filetree.ts'
import { nullReadBytes } from '../tests/nullReadBytes.ts'

const text = () => Promise.resolve('')

const anatJson = () =>
  Promise.resolve(
    JSON.stringify({
      rootOverwrite: 'anat',
      subOverwrite: 'anat',
      anatValue: 'anat',
    }),
  )
const subjectJson = () =>
  Promise.resolve(
    JSON.stringify({ subOverwrite: 'subject', subValue: 'subject' }),
  )
const rootJson = () =>
  Promise.resolve(JSON.stringify({ rootOverwrite: 'root', rootValue: 'root' }))

export const rootFileTree = new FileTree('/', '')
const stimuliFileTree = new FileTree('/stimuli', 'stimuli', rootFileTree)
const subjectFileTree = new FileTree('/sub-01', 'sub-01', rootFileTree)
const sessionFileTree = new FileTree(
  '/sub-01/ses-01',
  'ses-01',
  subjectFileTree,
)
const anatFileTree = new FileTree(
  '/sub-01/ses-01/anat',
  'anat',
  sessionFileTree,
)

export const dataFile = {
  text,
  path: '/sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz',
  name: 'sub-01_ses-01_T1w.nii.gz',
  size: 311112,
  ignored: false,
  stream: new ReadableStream<Uint8Array>(),
  readBytes: nullReadBytes,
  parent: anatFileTree,
}

anatFileTree.files = [
  dataFile,
  {
    text: anatJson,
    path: '/sub-01/ses-01/anat/sub-01_ses-01_T1w.json',
    name: 'sub-01_ses-01_T1w.json',
    size: 311112,
    ignored: false,
    stream: new ReadableStream<Uint8Array>(),
    readBytes: async (size: number) => new TextEncoder().encode(await anatJson()),
    parent: anatFileTree,
  },
]

sessionFileTree.files = []
sessionFileTree.directories = [anatFileTree]

subjectFileTree.files = [
  {
    text: subjectJson,
    path: '/sub-01/ses-01_T1w.json',
    name: 'ses-01_T1w.json',
    size: 311112,
    ignored: false,
    stream: new ReadableStream<Uint8Array>(),
    readBytes: async (size: number) => new TextEncoder().encode(await subjectJson()),
    parent: subjectFileTree,
  },
]
subjectFileTree.directories = [sessionFileTree]

stimuliFileTree.files = [...Array(10).keys()].map((i) => (
  {
    text,
    path: `/stimuli/stimfile${i}.png`,
    name: `stimfile${i}.png`,
    size: 2048,
    ignored: false,
    stream: new ReadableStream<Uint8Array>(),
    readBytes: nullReadBytes,
    parent: stimuliFileTree,
  }
))

rootFileTree.files = [
  {
    text: rootJson,
    path: '/T1w.json',
    name: 'T1w.json',
    size: 311112,
    ignored: false,
    stream: new ReadableStream<Uint8Array>(),
    readBytes: async (size: number) => new TextEncoder().encode(await rootJson()),
    parent: rootFileTree,
  },
]
rootFileTree.directories = [stimuliFileTree, subjectFileTree]

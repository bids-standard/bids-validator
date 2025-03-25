import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { pathsToTree } from '../files/filetree.ts'
import { nullReadBytes } from '../tests/nullReadBytes.ts'

const anatJson = JSON.stringify({
  rootOverwrite: 'anat',
  subOverwrite: 'anat',
  anatValue: 'anat',
})
const subjectJson = JSON.stringify({ subOverwrite: 'subject', subValue: 'subject' })
const rootJson = JSON.stringify({ rootOverwrite: 'root', rootValue: 'root' })

function readBytes(json: string) {
  return (size: number) =>
    Promise.resolve(new TextEncoder().encode(json) as Uint8Array<ArrayBuffer>)
}

export const rootFileTree = pathsToTree([
  '/dataset_description.json',
  '/T1w.json',
  '/sub-01/ses-01_T1w.json',
  '/sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz',
  '/sub-01/ses-01/anat/sub-01_ses-01_T1w.json',
  ...[...Array(10).keys()].map((i) => `/stimuli/stimfile${i}.png`),
])

const rootJSONFile = rootFileTree.get('T1w.json') as BIDSFile
rootJSONFile.readBytes = readBytes(rootJson)

const subjectFileTree = rootFileTree.get('sub-01') as FileTree
const subjectJSONFile = subjectFileTree.files[0] as BIDSFile
subjectJSONFile.readBytes = readBytes(subjectJson)

const anatFileTree = subjectFileTree.directories[0].directories[0] as FileTree

export const dataFile = anatFileTree.get('sub-01_ses-01_T1w.nii.gz') as BIDSFile
const anatJSONFile = anatFileTree.get('sub-01_ses-01_T1w.json') as BIDSFile
anatJSONFile.readBytes = (size: number) =>
  Promise.resolve(new TextEncoder().encode(anatJson) as Uint8Array<ArrayBuffer>)

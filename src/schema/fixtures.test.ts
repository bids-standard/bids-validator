import type { BIDSFile, FileTree } from '../types/filetree.ts'
import { pathsToTree } from '../files/filetree.test.ts'
import { StringOpener } from '../files/openers.test.ts'

const anatJson = JSON.stringify({
  rootOverwrite: 'anat',
  subOverwrite: 'anat',
  anatValue: 'anat',
})
const subjectJson = JSON.stringify({ subOverwrite: 'subject', subValue: 'subject' })
const rootJson = JSON.stringify({ rootOverwrite: 'root', rootValue: 'root' })

function readBytes(json: string) {
  return (_size: number) =>
    Promise.resolve(new TextEncoder().encode(json) as Uint8Array<ArrayBuffer>)
}

export const rootFileTree = pathsToTree([
  '/dataset_description.json',
  '/T1w.json',
  '/task-movie_events.json',
  '/task-movie_physio.json',
  '/sub-01/ses-01_T1w.json',
  '/sub-01/ses-01/anat/sub-01_ses-01_T1w.nii.gz',
  '/sub-01/ses-01/anat/sub-01_ses-01_T1w.json',
  '/sub-01/ses-01/func/sub-01_ses-01_task-movie_bold.nii.gz',
  '/sub-01/ses-01/func/sub-01_ses-01_task-movie_bold.nii.gz',
  '/sub-01/ses-01/func/sub-01_ses-01_task-movie_events.tsv',
  '/sub-01/ses-01/func/sub-01_ses-01_task-movie_physio.tsv.gz',
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
anatJSONFile.readBytes = readBytes(anatJson)

const eventsSidecar = rootFileTree.get('task-movie_events.json') as BIDSFile
eventsSidecar.readBytes = readBytes(
  JSON.stringify({
    StimulusPresentation: {
      ScreenDistance: 1.8,
      ScreenOrigin: ['top', 'left'],
      ScreenResolution: [1920, 1080],
      ScreenSize: [0.472, 0.265],
    },
  }),
)
/* Minimal motion dataset; motion.tsv is headerless per BEP029 */
export const motionFileTree = pathsToTree([
  '/dataset_description.json',
  '/sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv',
  '/sub-01/motion/sub-01_task-walk_tracksys-imu_channels.tsv',
])

const motionFile = motionFileTree.get(
  'sub-01/motion/sub-01_task-walk_tracksys-imu_motion.tsv',
) as BIDSFile
motionFile.opener = new StringOpener('0\t0\t0\n0.1\t0.2\t0.3\n')

const motionChannelsFile = motionFileTree.get(
  'sub-01/motion/sub-01_task-walk_tracksys-imu_channels.tsv',
) as BIDSFile
motionChannelsFile.opener = new StringOpener(
  'name\tcomponent\ttype\ttracked_point\tunits\n' +
    't1_acc_x\tx\tACCEL\tt1\tm/s^2\n' +
    't1_acc_y\ty\tACCEL\tt1\tm/s^2\n' +
    't1_acc_z\tz\tACCEL\tt1\tm/s^2\n',
)

const physioSidecar = rootFileTree.get('task-movie_physio.json') as BIDSFile
physioSidecar.readBytes = readBytes(
  JSON.stringify({
    SamplingFrequency: 100,
    StartTime: 0,
    PhysioType: 'eyetrack',
  }),
)

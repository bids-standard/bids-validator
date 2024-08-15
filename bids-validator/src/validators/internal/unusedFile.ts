import type { GenericSchema } from '../../types/schema.ts'
import type { BIDSFile, FileTree } from '../../types/filetree.ts'
import type { BIDSContextDataset } from '../../schema/context.ts'

function* walkFileTree(fileTree?: FileTree): Generator<BIDSFile> {
  if (!fileTree) {
    return
  }
  for (const file of fileTree.files) {
    if (!file.ignored) {
      yield file
    }
  }
  for (const dir of fileTree.directories) {
    if (!dir.ignored) {
      yield* walkFileTree(dir)
    }
  }
}

export async function unusedStimulus(
  schema: GenericSchema,
  dsContext: BIDSContextDataset,
) {
  const stimDir = dsContext.tree.get('stimuli') as FileTree
  const unusedStimuli = [...walkFileTree(stimDir)].filter((stimulus) => !stimulus.viewed)
  if (unusedStimuli.length) {
    dsContext.issues.add({ code: 'UNUSED_STIMULUS', affects: unusedStimuli.map((s) => s.path) })
  }
}

const standalone_json = ['dataset_description.json', 'genetic_info.json']

export async function sidecarWithoutDatafile(
  schema: GenericSchema,
  dsContext: BIDSContextDataset,
) {
  const unusedSidecars = [...walkFileTree(dsContext.tree)].filter(
    (file) => (!file.viewed && file.name.endsWith('.json') &&
      !standalone_json.includes(file.name)),
  )
  unusedSidecars.forEach((sidecar) => {
    dsContext.issues.add({ code: 'SIDECAR_WITHOUT_DATAFILE', location: sidecar.path })
  })
}

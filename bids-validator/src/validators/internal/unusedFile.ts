import { GenericSchema } from '../../types/schema.ts'
import { BIDSFile, FileTree } from '../../types/filetree.ts'
import { BIDSContextDataset } from '../../schema/context.ts'

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
  const stimDir = dsContext.tree.directories.find((dir) => dir.name === 'stimuli')
  const unusedStimuli = [...walkFileTree(stimDir)].filter((stimulus) => !stimulus.viewed)
  if (unusedStimuli.length) {
    dsContext.issues.addNonSchemaIssue('UNUSED_STIMULUS', unusedStimuli)
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
  if (unusedSidecars.length) {
    dsContext.issues.addNonSchemaIssue('SIDECAR_WITHOUT_DATAFILE', unusedSidecars)
  }
}

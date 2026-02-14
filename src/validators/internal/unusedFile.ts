import type { GenericSchema } from '../../types/schema.ts'
import type { BIDSFile, FileTree } from '../../types/filetree.ts'
import type { BIDSContextDataset } from '../../schema/context.ts'

function* walkFileTree(fileTree: FileTree, dsContext: BIDSContextDataset): Generator<BIDSFile> {
  if (!fileTree) {
    return
  }

  for (const file of fileTree.files) {
    if (!file.ignored) {
      yield file
    }
  }

  for (const dir of fileTree.directories) {
    if (!dir.ignored && !dsContext.isPseudoFile(dir) && !dsContext.isOpaqueDirectory(dir)) {
      yield* walkFileTree(dir, dsContext)
    }
  }
}

export async function unusedStimulus(
  schema: GenericSchema,
  dsContext: BIDSContextDataset,
) {
  const stimDir = dsContext.tree.get('stimuli') as FileTree
  const unusedStimuli = [...walkFileTree(stimDir, dsContext)].filter((stimulus) =>
    !stimulus.viewed
  )
  if (unusedStimuli.length) {
    dsContext.issues.add({ code: 'UNUSED_STIMULUS', affects: unusedStimuli.map((s) => s.path) })
  }
}

const standalone_json = ['dataset_description.json', 'genetic_info.json']

function isSidecarFile(file: BIDSFile): boolean {
  if (!file.name.endsWith('.json')) {
    return false
  }
  if (standalone_json.includes(file.name)) {
    return false
  }
  // prov files are not sidecars
  if (file.path.startsWith('/prov/')) {
    return false
  }
  // coordsystem.json files are kind-of sidecars, and they're picked up by
  // associations. We may want to exclude them in the future.
  return true
}

export async function sidecarWithoutDatafile(
  schema: GenericSchema,
  dsContext: BIDSContextDataset,
) {
  for (const file of walkFileTree(dsContext.tree, dsContext)) {
    if (!file.viewed && isSidecarFile(file)) {
      dsContext.issues.add({ code: 'SIDECAR_WITHOUT_DATAFILE', location: file.path })
    }
  }
}

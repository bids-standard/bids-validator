import { collectSubjectMetadata } from './collectSubjectMetadata.ts'
import { readAll, readerFromStreamReader } from '../deps/stream.ts'
import { Summary } from '../types/validation-result.ts'
import { BIDSContext } from '../schema/context.ts'

const modalitiesCount: Record<string, number> = {
  mri: 0,
  pet: 0,
  meg: 0,
  eeg: 0,
  ieeg: 0,
  microscopy: 0,
}

const secondaryModalitiesCount: Record<string, number> = {
  MRI_Diffusion: 0,
  MRI_Structural: 0,
  MRI_Functional: 0,
  MRI_Perfusion: 0,
  PET_Static: 0,
  PET_Dynamic: 0,
  iEEG_ECoG: 0,
  iEEG_SEEG: 0,
}

const modalityPrettyLookup: Record<string, string> = {
  mri: 'MRI',
  pet: 'PET',
  meg: 'MEG',
  eeg: 'EEG',
  ieeg: 'iEEG',
  micro: 'Microscopy',
}

const secondaryLookup: Record<string, string> = {
  dwi: 'MRI_Diffusion',
  anat: 'MRI_Structural',
  bold: 'MRI_Functional',
  perf: 'MRI_Perfusion',
}

function computeModalities(modalities: Record<string, number>): string[] {
  // Order by matching file count
  const nonZero = Object.keys(modalities).filter((a) => modalities[a] !== 0)
  if (nonZero.length === 0) {
    return []
  }
  const sortedModalities = nonZero.sort((a, b) => {
    if (modalities[b] === modalities[a]) {
      // On a tie, hand it to the non-MRI modality
      if (b === 'MRI') {
        return -1
      } else {
        return 0
      }
    }
    return modalities[b] - modalities[a]
  })
  return sortedModalities.map((mod) =>
    mod in modalityPrettyLookup ? modalityPrettyLookup[mod] : mod,
  )
}

function computeSecondaryModalities(
  secondary: Record<string, number>,
): string[] {
  const nonZeroSecondary = Object.keys(secondary).filter(
    (a) => secondary[a] !== 0,
  )
  const sortedSecondary = nonZeroSecondary.sort(
    (a, b) => secondary[b] - secondary[a],
  )
  return sortedSecondary
}

export const summary: Summary = {
  dataProcessed: false,
  totalFiles: -1,
  size: 0,
  sessions: new Set(),
  subjects: new Set(),
  subjectMetadata: [],
  tasks: new Set(),
  pet: {},
  get modalities() {
    return computeModalities(modalitiesCount)
  },
  get secondaryModalities() {
    return computeSecondaryModalities(secondaryModalitiesCount)
  },
}

export async function updateSummary(context: BIDSContext): Promise<void> {
  if (context.file.path.startsWith('/derivatives')) {
    return
  }

  summary.totalFiles++
  summary.size += await context.file.size

  if ('sub' in context.entities) {
    summary.subjects.add(context.entities.sub)
  }
  if ('ses' in context.entities) {
    summary.sessions.add(context.entities.ses)
  }
  if (context.extension === '.json') {
    const parsedJson = JSON.parse(await context.file.text())
    if ('TaskName' in parsedJson) {
      summary.tasks.add(parsedJson.TaskName)
    }
  }
  if (context.modality) {
    modalitiesCount[context.modality]++
  }

  if (context.datatype in secondaryLookup) {
    const key = secondaryLookup[context.datatype]
    secondaryModalitiesCount[key]++
  } else if (context.datatype === 'pet' && 'rec' in context.entities) {
    if (['acstat', 'nacstat'].includes(context.entities.rec)) {
      secondaryModalitiesCount.PET_Static++
    } else if (['acdyn', 'nacdyn'].includes(context.entities.rec)) {
      secondaryModalitiesCount.PET_Dynamic++
    }
  }

  if (context.file.path.includes('participants.tsv')) {
    let tsvContents = await context.file.text()
    summary.subjectMetadata = collectSubjectMetadata(tsvContents)
  }
}

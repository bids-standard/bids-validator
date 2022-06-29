// import { Summary } from '../types/summary.ts'

export const summary = {
  dataProcessed: false,
  totalFiles: -1,
  size: 0,
  sessions: new Set(),
  subjects: new Set(),
  subjectMetadata: {},
  tasks: new Set(),
  modalities: {
    mri: 0,
    pet: 0,
    meg: 0,
    eeg: 0,
    ieeg: 0,
    microscopy: 0,
  },
  secondaryModalities: {
    MRI_Diffusion: 0,
    MRI_Structural: 0,
    MRI_Functional: 0,
    MRI_Perfusion: 0,
    PET_Static: 0,
    PET_Dynamic: 0,
    iEEG_ECoG: 0,
    iEEG_SEEG: 0,
  },
  pet: null,
}

const modalityLookup = {}

const secondaryLookup = {
  dwi: 'MRI_Diffusion',
  anat: 'MRI_Structural',
  bold: 'MRI_Functional',
  perf: 'MRI_Perfusion',
}

export function updateSummary(context: Context): void {
  if (context.file.path.startsWith('/derivatives')) {
    return
  }

  summary.totalFiles++
  summary.size += context.file.size

  if ('sub' in context.entities) {
    summary.subjects.add(context.entities.sub)
  }
  if ('ses' in context.entities) {
    summary.sesssions.add(context.entities.ses)
  }
  if ('task' in context.entities) {
    summary.tasks.add(context.entities.task)
  }
  if (context.modality) {
    summary.modalities[context.modality]++
  }

  if (context.datatype in secondaryLookup) {
    const key = secondaryLookup[context.datatype]
    secondary[key]++
  } else if (context.datatype === 'pet' && 'rec' in context.entities) {
    if (['acstat', 'nacstat'].includes(context.entities.rec)) {
      secondaty.PET_Static++
    } else if (['acdyn', 'nacdyn'].includes(context.entities.rec)) {
      secondaty.PET_Dynamic++
    }
  }
}

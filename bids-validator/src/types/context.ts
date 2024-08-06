import { GenericSchema } from './schema.ts'
import { ValidatorOptions } from '../setup/options.ts'
import { FileTree } from '../types/filetree.ts'

export interface ContextDatasetSubjects {
  sub_dirs: string[]
  participant_id?: string[]
  phenotype?: string[]
}

export interface ContextDataset {
  dataset_description: Record<string, unknown>
  tree: FileTree
  ignored: any[]
  datatypes: string[]
  modalities: string[]
  subjects?: ContextDatasetSubjects
  options?: ValidatorOptions
  sidecarKeyValidated: Set<string>
}
export interface ContextSubjectSessions {
  ses_dirs: string[]
  session_id: string[]
  phenotype: string[]
}
export interface ContextSubject {
  sessions: ContextSubjectSessions
}
export interface ContextAssociationsEvents {
  path?: string
  onset?: string[]
}
export interface ContextAssociationsAslcontext {
  path: string
  n_rows: number
  volume_type: string[]
}
export interface ContextAssociationsM0scan {
  path: string
}
export interface ContextAssociationsMagnitude {
  path: string
}
export interface ContextAssociationsMagnitude1 {
  path: string
}
export interface ContextAssociationsBval {
  path: string
  n_cols: number
  n_rows: number
  values: string[] // Actually numbers, but only used in functions that convert
}
export interface ContextAssociationsBvec {
  path: string
  n_cols: number
  n_rows: number
}
export interface ContextAssociationsChannels {
  path?: string
  type?: string[]
  short_channel?: string[]
  sampling_frequency?: string[]
}
export interface ContextAssociationsCoordsystem {
  path: string
}
export interface ContextAssociations {
  events?: ContextAssociationsEvents
  aslcontext?: ContextAssociationsAslcontext
  m0scan?: ContextAssociationsM0scan
  magnitude?: ContextAssociationsMagnitude
  magnitude1?: ContextAssociationsMagnitude1
  bval?: ContextAssociationsBval
  bvec?: ContextAssociationsBvec
  channels?: ContextAssociationsChannels
  coordsystem?: ContextAssociationsCoordsystem
}
export interface ContextNiftiHeaderDimInfo {
  freq: number
  phase: number
  slice: number
}
export interface ContextNiftiHeaderXyztUnits {
  xyz: 'unknown' | 'meter' | 'mm' | 'um'
  t: 'unknown' | 'sec' | 'msec' | 'usec'
}
export interface ContextNiftiHeader {
  dim_info: ContextNiftiHeaderDimInfo
  dim: number[]
  pixdim: number[]
  shape: number[]
  voxel_sizes: number[]
  xyzt_units: ContextNiftiHeaderXyztUnits
  qform_code: number
  sform_code: number
}
export interface Context {
  schema?: GenericSchema
  dataset: ContextDataset
  subject: ContextSubject
  path: string
  size: number
  entities: object
  datatype: string
  suffix: string
  extension: string
  modality: string
  sidecar: Record<string, any>
  sidecarKeyOrigin: Record<string, string>
  associations: ContextAssociations
  columns: object
  json: object
  nifti_header?: ContextNiftiHeader
}

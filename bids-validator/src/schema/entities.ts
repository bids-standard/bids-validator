import { FileTree, BIDSFile } from '../files/filetree.ts'

export interface BIDSEntities {
  groups: string[]
}

export function readEntities(dataset: FileTree, file: BIDSFile): BIDSEntities {
  return { groups: [''] }
}

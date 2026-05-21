export { BIDSFile } from '../../types/filetree.ts'
export type { FileOpener, SymlinkReason, UnresolvedLink } from '../../types/filetree.ts'
export { HTTPOpener, NullFileOpener } from '../../files/openers.ts'
export {
  createUTF8Stream,
  streamFromString,
  streamFromUint8Array,
  UnicodeDecodeError,
} from '../../files/streams.ts'

// Back-compat — removed at v4.0
/** @deprecated Import from '@bids/validator/files/deno' instead. */
export { readFileTree } from '../../files/deno.ts'
/** @deprecated Import from '@bids/validator/files/deno' instead. */
export { BIDSFileDeno } from '../../files/deno.ts'

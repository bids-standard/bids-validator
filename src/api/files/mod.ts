/**
 * Cross-environment per-file primitives — {@link BIDSFile},
 * {@link FileOpener} contract, and stream helpers used to build a
 * custom file source.
 *
 * Source-specific helpers live in {@link [files/deno]},
 * {@link [files/browser]}, and {@link [files/git]}. Tree-level
 * primitives live in {@link [filetree]}.
 *
 * @module
 */

import { BIDSFileDeno as _BIDSFileDeno, readFileTree as _readFileTree } from '../../files/deno.ts'

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
/** @deprecated Use {@link [files/deno].readFileTree} instead. */
export const readFileTree = _readFileTree
/** @deprecated Use {@link [files/deno].BIDSFileDeno} instead. */
export const BIDSFileDeno = _BIDSFileDeno

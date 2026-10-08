/**
 * Access filesystem files using Deno.
 *
 * {@link readFileTree} walks a directory and returns a populated
 * {@link [filetree].FileTree}. Individual files are represented by
 * {@link BIDSFileDeno} (a {@link [files].BIDSFile} subclass) backed by
 * {@link FsFileOpener}. Use this module in CLIs, Deno servers, and
 * other environments with filesystem access.
 *
 * @module
 */

export { BIDSFileDeno, readFileTree } from '../../../files/deno.ts'
export { FsFileOpener } from '../../../files/openers.ts'

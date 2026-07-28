/**
 * Access files using the browser File API.
 *
 * {@link fileListToTree} converts a `File[]` (typically from an
 * `<input type="file" webkitdirectory>` element or a drag-and-drop
 * event) into a {@link [filetree].FileTree}. Files are represented by
 * {@link BIDSFileBrowser} (a {@link [files].BIDSFile} subclass) backed
 * by {@link BrowserFileOpener}.
 *
 * @module
 */

export { BIDSFileBrowser, fileListToTree } from '../../../files/browser.ts'
export { BrowserFileOpener } from '../../../files/openers.ts'

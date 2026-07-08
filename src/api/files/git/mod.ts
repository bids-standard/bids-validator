/**
 * Access files in git and git-annex repositories.
 *
 * {@link readGitTree} produces a {@link [filetree].FileTree} for a
 * given commit-ish without a full checkout. Files are opened lazily by
 * {@link GitFileOpener} (objects in the repository) or
 * {@link AnnexedGitFileOpener} (files stored in git-annex backends).
 *
 * @module
 */

export { AnnexedGitFileOpener, GitFileOpener, readGitTree } from '../../../files/git.ts'

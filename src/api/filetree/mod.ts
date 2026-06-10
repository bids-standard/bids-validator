/**
 * Build and manipulate {@link FileTree} structures.
 *
 * Use {@link filesToTree} to assemble a tree from a flat
 * {@link [files].BIDSFile} list, {@link subtree} to derive a child
 * tree, and {@link FileIgnoreRules} / {@link readBidsIgnore} /
 * {@link loadBidsIgnore} to honour `.bidsignore` and analogous files.
 * Per-file primitives live in {@link [files]}; source-specific tree
 * builders live in {@link [files/deno]}, {@link [files/browser]}, and
 * {@link [files/git]}.
 *
 * @module
 */

export { FileTree } from '../../types/filetree.ts'
export { filesToTree, loadBidsIgnore, subtree } from '../../files/filetree.ts'
export { FileIgnoreRules, readBidsIgnore } from '../../files/ignore.ts'

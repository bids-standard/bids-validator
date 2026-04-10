# Symlink Handling in bids-validator

## Status

Discussion document. Not yet a specification.

## Problem

The validator has two tree-building backends: work tree (`deno.ts`, reads the
filesystem) and git tree (`git.ts`, reads from a git ref via isomorphic-git).
These backends handle symlinks differently, producing divergent behavior for
the same dataset. Some of these divergences are inherent to the substrate;
others are bugs or missing handling.

This document enumerates the symlink scenarios, the use cases that motivate
different behaviors, and the design choices that need resolution.

## Background: How Symlinks Appear in Each Backend

### Work tree (`deno.ts`)

`Deno.readDir()` reports each entry's type. A symlink has `isSymlink = true`
regardless of whether its target is a file or directory. `isFile` and
`isDirectory` are both `false` for symlink entries.

The current code treats all symlinks as files:

```typescript
// deno.ts — current logic (simplified)
if (dirEntry.isFile || dirEntry.isSymlink) {
  const fullPath = join(rootPath, thisPath)
  try {
    const fileInfo = await Deno.stat(fullPath) // follows symlink
    opener = new FsFileOpener(rootPath, thisPath, fileInfo)
  } catch (_) {
    // Assumes dangling symlink is git-annex
    const { key, size, gitdir } = await parseAnnexedFile(fullPath)
    opener = new AnnexedGitFileOpener(key, size, gitdir, ...)
  }
  tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
}
if (dirEntry.isDirectory) {
  // recurse...
}
```

`Deno.stat()` follows symlinks. If the target is a regular file, this works.
If the target is a directory, `stat` succeeds but returns `isDirectory: true` —
the entry is pushed to `tree.files` as a file backed by `FsFileOpener`
pointing at a directory. The directory contents are never walked.

If `stat` fails (dangling symlink), the code unconditionally enters the annex
detection path. For non-annex dangling symlinks, `parseAnnexedFile()` throws.

### Git tree (`git.ts`)

Git stores all symlinks as blobs with mode `0o120000`. The blob content is the
symlink target path as a UTF-8 string. Git does not distinguish file symlinks
from directory symlinks.

The current code classifies symlinks during the walk:

```typescript
// git.ts — current logic (simplified)
if (mode === 0o120000 && content) {
  const target = new TextDecoder().decode(content)
  symlinkMap.set(filepath, target)
  const annexParsed = parseAnnexKey(target)
  if (annexParsed !== null) {
    opener = new AnnexedGitFileOpener(...)
  } else {
    // Defer non-annex symlinks until walk completes
    deferredSymlinks.push({ filepath, target })
    return filepath
  }
}
```

After the walk, a post-walk pass resolves deferred symlinks by following chains
through the symlink map and looking up targets via `readBlob`. Unresolvable
symlinks (broken, cyclic, out-of-tree) are silently dropped.

## Symlink Scenarios

### 1. Git-annex pointer symlinks

Target matches the annex key pattern:

```
../../.git/annex/objects/XX/YY/MD5E-s<size>--<hash><ext>/MD5E-s<size>--<hash><ext>
```

Both backends detect these via `parseAnnexKey()` and create an
`AnnexedGitFileOpener` that lazily resolves to local content, a remote URL, or
a null opener.

**Current behavior:** Handled correctly in both backends.

### 2. In-tree file symlinks

Target resolves to a regular file within the dataset:

```
sub-01/func/sub-01_task-rest_bold.nii.gz -> ../anat/sub-01_T1w.nii.gz
```

**Work tree:** `Deno.stat()` follows the symlink transparently. Works.

**Git tree:** Resolved by the post-walk pass. Works.

### 3. Symlink chains

`A -> B -> C` where A and B are symlinks, C is a regular file or annex key.

**Work tree:** OS resolves the full chain transparently.

**Git tree:** Post-walk resolution follows chains through `symlinkMap` up to
depth 10.

### 4. Out-of-tree file symlinks

Target resolves to a path outside the dataset root:

```
stimuli/face.png -> /data/shared/stimuli/face.png
```

**Work tree:** `Deno.stat()` follows the symlink to the external file.
`FsFileOpener` serves its content with no indication the file is external.

**Git tree:** Target resolves outside the commit tree. **Silently dropped.**

### 5. Directory symlinks

Target is a directory:

```
sub-01 -> /data/raw/subject_001/
```

or within the dataset:

```
derivatives/pipeline-v2 -> derivatives/pipeline-v1
```

**Work tree:** `Deno.readDir` reports `isSymlink = true`, `isDirectory = false`
(Deno does not follow the symlink to determine target type). The current code
takes the `isFile || isSymlink` branch. `Deno.stat()` follows the symlink and
returns `isDirectory: true`, but the code pushes a file entry backed by
`FsFileOpener` pointing at a directory. **The directory contents are never
walked. This is a bug.** Subsequent `stream()` or `text()` calls on this entry
would fail when trying to open a directory as a file.

**Git tree:** Git stores all symlinks as blobs, so a directory symlink is
indistinguishable from a file symlink during the walk. However, the target path
can be resolved against the commit tree. If the target resolves to a tree
object (directory), its contents could be grafted into the `FileTree` at the
symlink's location:

```typescript
// git.ts — potential directory symlink handling (sketch)
// After resolving symlink target to a path in the tree:
try {
  const { type } = await git.readObject({
    oid: commitOid,
    filepath: resolvedPath,
    ...gitOptions,
  })
  if (type === 'tree') {
    // Target is a directory — walk the subtree and attach
    // its contents under the symlink's path
    const subtreeFiles = await walkSubtree(resolvedPath, commitOid, gitOptions)
    for (const file of subtreeFiles) {
      const graftedPath = filepath + file.path.slice(resolvedPath.length)
      files.push(new BIDSFile('/' + graftedPath, file.opener, ignore))
    }
  } else {
    // Target is a file — use GitFileOpener as today
  }
} catch {
  // Target does not exist — broken symlink
}
```

This would produce the same tree structure as a work tree where the OS follows
the directory symlink. The current code does not attempt this — directory
symlinks are treated as file symlinks, and if the target path happens not to
match a blob, they are silently dropped.

Complications:

- Chains of directory symlinks require recursive grafting.
- A directory symlink to a path that itself contains symlinks (file or
  directory) requires the grafted subtree to resolve its own symlinks.
- The grafted files appear at two paths in the tree (the original directory
  path and the symlink path), which could confuse deduplication or issue
  reporting.
- Out-of-tree directory symlinks remain unresolvable in a git tree.

### 6. Dangling symlinks (target does not exist)

This includes several sub-cases that the filesystem cannot distinguish:

#### 6a. Target in an uninitialized submodule

```
stimuli -> sourcedata/original-experiment/stimuli/
```

where `sourcedata/` is a submodule registered in `.gitmodules` but not
initialized. The target could be a file or a directory inside the submodule —
there is no way to determine which from the dangling symlink alone.

**Work tree:** `Deno.stat()` fails (ENOENT). Falls into annex detection.
`parseAnnexedFile()` reads the symlink target, fails to match the annex key
pattern. **Crashes.**

**Git tree:** The submodule appears as `entryType === 'commit'` in the git
tree (currently skipped). The symlink target resolves to a path under a
non-existent subtree. **Silently dropped.**

#### 6b. Broken symlink (in-tree, target deleted)

```
sub-01/anat/sub-01_T1w.json -> sub-01_T1w_backup.json  # backup was deleted
```

Target resolves to a path within the dataset root, but no file or directory
exists there.

**Work tree:** Same crash path as 6a.

**Git tree:** Target not found in commit tree. **Silently dropped.**

#### 6c. Cyclic symlinks

```
a -> b
b -> a
```

**Work tree:** `Deno.stat()` fails (ELOOP). Same crash path as 6a.

**Git tree:** Chain resolution exceeds max depth (10). **Silently dropped.**

## Use Cases

Different users have different expectations for symlink behavior. The
appropriate handling depends on context.

### Data archive / repository

An archive stores datasets in git/git-annex. Validation typically runs against
a git ref (possibly bare). Symlinks are git-annex pointers or occasionally
in-tree references. Out-of-tree symlinks are unexpected.

**Expectations:**

- Annex symlinks resolve to content (local or remote)
- In-tree symlinks resolve normally
- Out-of-tree symlinks are errors
- Dangling symlinks should be reported, not silent

### Data processor / analyst

A user works with a checked-out dataset. Submodules may or may not be
initialized. The dataset is on their own machine. Symlinks may point outside
the dataset to shared storage.

**Expectations:**

- All symlinks that the OS resolves should work (including out-of-tree)
- Directory symlinks should be followed
- Dangling symlinks should produce a warning, not a crash
- Missing submodule content is expected (not checked out yet)

### BIDS view constructor

A researcher builds a virtual BIDS dataset by creating a directory of symlinks
pointing into pre-existing data (possibly in non-BIDS organization). Nearly
every file is an out-of-tree symlink. Directories may also be symlinks.

**Expectations:**

- Out-of-tree symlinks are the primary mechanism; must not error
- Directory symlinks may be used for subject or session directories
- Filesystem resolution is the correct behavior

## Design Questions

### 1. Should the two backends produce identical trees?

The backends operate on fundamentally different substrates. The git tree has no
external filesystem to resolve against; the work tree has no commit tree. Full
behavioral parity is not achievable:

- A BIDS view's out-of-tree symlinks are valid in a work tree but
  unrepresentable in a git tree.
- A git tree can resolve in-tree symlinks against the commit; a work tree
  resolves them via the OS.
- Directory symlinks create subtrees in a work tree but are flat blobs in git.

The shared contract is the `FileTree` / `BIDSFile` / `FileOpener` interface.
Both backends should produce trees that the validator processes uniformly, but
the set of files in the tree may legitimately differ.

### 2. What should happen for each unresolvable case?

For each scenario where a symlink cannot be fully resolved, the choices are:

- **error** — validation issue is raised, validation continues
- **warn** — warning is raised, validation continues
- **ignore** — symlink is silently omitted from the tree

| Target location | Target type | Git tree | Work tree          |
| --------------- | ----------- | -------- | ------------------ |
| Out-of-tree     | File        | ERROR    | valid (OS follows) |
| Out-of-tree     | Directory   | ERROR    | valid (OS follows) |
| Out-of-tree     | Missing     | ERROR    | ERROR              |
| In-tree         | File        | valid    | valid (OS follows) |
| In-tree         | Directory   | valid    | valid (OS follows) |
| In-tree         | Missing     | ERROR    | ERROR              |
| Submodule       | File        | WARN     | valid (OS follows) |
| Submodule       | Directory   | WARN     | valid (OS follows) |
| Submodule       | Missing     | WARN     | ERROR              |
| Cyclic          | N/A         | ERROR    | ERROR              |

Using OS resolution, we are unaware of git submodules.
The link is resolvable, dangling, or cyclic.

Walking a git tree, we reject out-of-tree objects. In-tree objects are resolvable.
Submodules are detectable, and therefore we can warn,
but cannot distinguish files/directories/broken links.

In-tree directory resolution requires loop detection as well.
Resolving this may be out-of-scope for work trees, but is required for git.

Deferred:

- Identifying uninitialized submodules in work trees.
- Descending into initialized submodules in git trees (full clones)
- Resolving and descending into uninitialized submodules in git trees.

### 3. How should dangling symlinks be represented?

A dangling symlink's target type (file vs. directory) cannot be determined from
the symlink alone. The filesystem provides no information when the target does
not exist. In a git tree, the target blob is a flat string.

Options:

**A. Skip entirely.** The path does not appear in the tree. Simple, but
silent. Code that expects the path finds nothing. This is the current git-tree
behavior.

**B. Add a file entry with an erroring opener.** The path appears in
`tree.files`. Any access attempt (`size`, `text()`, etc.) throws a
`SymlinkError` with the reason. The validator catches this and creates an
issue.

```typescript
class SymlinkError extends Error {
  reason: 'broken' | 'cycle' | 'submodule' | 'out-of-tree'
  target: string
  constructor(reason, path, target) { ... }
}

class UnresolvedSymlinkOpener implements FileOpener {
  #error: SymlinkError
  constructor(reason: string, path: string, target: string) {
    this.#error = new SymlinkError(reason, path, target)
  }
  get size(): number { throw this.#error }
  async stream() { throw this.#error }
  async text() { throw this.#error }
  async readBytes() { throw this.#error }
}
```

Pro: the path exists in the tree, so the validator can report a located issue.
Con: the entry is a file, so if the target was meant to be a directory, code
that tries to descend into it won't find a directory node.

**C. Add to a new `links` collection on `FileTree`.** Makes the ambiguity
explicit in the data model.

```typescript
class FileTree {
  files: BIDSFile[]
  directories: FileTree[]
  links: { path: string; target: string; reason: string }[]
  // ...
}
```

Pro: no false assumption about file vs. directory.
Con: every tree-walking code path must be updated to consider `links`.

**D. Add both an empty file and an empty directory.**

```typescript
// File entry with erroring opener
tree.files.push(new BIDSFile(path, new UnresolvedSymlinkOpener(...)))
// Empty directory entry
tree.directories.push(new FileTree(path, name, tree, ignore))
```

Pro: code that makes either assumption finds something.
Con: search/enumeration code may be confused by a path appearing as both.

**Decision**:

C. However, dangling links will be treated as absent. Including them in the
`FileTree` object allows the issues to be generated when walking the tree,
and allows us to be forgiving of dangling links in opaque directories.

### 4. Where should errors be reported?

Tree-building currently has no issue collector. Options:

**A. Thrown from the opener on access (lazy).** No changes to tree building.
The validator's existing error handling catches the exception and creates an
issue. This is how `AnnexedGitFileOpener` already works when content is
unavailable (delegates to `NullFileOpener`).

```typescript
// In the validator's context-building code:
try {
  context.columns = await loadColumns(file)
} catch (error) {
  if (error instanceof SymlinkError) {
    context.dataset.issues.add({
      code: 'SYMLINK_' + error.reason.toUpperCase(),
      location: file.path,
    })
  }
}
```

**B. Collected during tree building.** Requires threading an issue collector
through the walk functions.

```typescript
// Would require changing signatures:
async function readFileTree(
  rootPath,
  prune,
  preferredRemote,
  issues,
): Promise<FileTree>
```

**C. Logged during tree building.** Issues appear in logs but not in
structured validation output.

**Decision**:

Errors should be reported when visiting the parent directory in `schema/walk.ts:_walkFileTree`.

Further question: Should bidsignore adjust behavior?

### 5. Should the work-tree backend use explicit symlink resolution?

The current approach (`Deno.stat()` follows symlinks transparently) is correct
for the BIDS view use case but prevents detecting out-of-tree symlinks and
causes crashes for dangling symlinks.

**Option A: Keep OS resolution, fix crashes.** Use `lstat` to detect symlinks,
`readLink` to read targets, then `stat` to follow. If `stat` succeeds (file or
directory), use OS resolution. If `stat` fails, handle gracefully instead of
crashing.

```typescript
// deno.ts — proposed
if (dirEntry.isSymlink) {
  const fullPath = join(rootPath, thisPath)
  const target = await Deno.readLink(fullPath)
  try {
    const fileInfo = await Deno.stat(fullPath) // follows symlink
    if (fileInfo.isDirectory) {
      // Recurse into the target directory
      const dirTree = await _readFileTree({ rootPath, relativePath: thisPath, ... })
      tree.directories.push(dirTree)
    } else {
      // Classify: annex key or regular file
      const annexParsed = parseAnnexKey(target)
      if (annexParsed !== null) {
        opener = new AnnexedGitFileOpener(...)
      } else {
        opener = new FsFileOpener(rootPath, thisPath, fileInfo)
      }
      tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
    }
  } catch (_) {
    // Dangling: annex key, broken, cycle, or submodule
    const annexParsed = parseAnnexKey(target)
    if (annexParsed !== null) {
      opener = new AnnexedGitFileOpener(...)
    } else {
      // Dangling non-annex: broken, cycle, or submodule
      // Target type (file vs dir) is unknown
      // ... how to represent? See question 3 ...
    }
  }
} else if (dirEntry.isFile) {
  opener = new FsFileOpener(rootPath, thisPath)
  tree.files.push(new BIDSFile(thisPath, opener, ignore, tree))
} else if (dirEntry.isDirectory) {
  // recurse...
}
```

Pro: preserves BIDS view behavior. Fixes directory symlink and crash bugs.
Con: out-of-tree symlinks are silently valid; no way to distinguish them from
in-tree without additional path checks.

**Option B: Explicit resolution for all symlinks.** Use `lstat` + `readLink`,
then resolve the target path explicitly. Check if the resolved path is within
the dataset root. Follow in-tree targets; report out-of-tree targets.

Pro: full visibility into symlink structure.
Con: breaks the BIDS view use case unless out-of-tree is explicitly allowed
(e.g., via a CLI flag).

**Option C: Hybrid.** Default to OS resolution (option A). Add an optional
strict mode (e.g., `--strict-symlinks`) that uses explicit resolution and
reports out-of-tree symlinks.

**Decision**:

Deferred to implementation. Clear logic and resolving bugs is the priority.

## Summary of Current Bugs

1. **Directory symlinks not followed in work tree.** A symlink to a directory
   is pushed to `tree.files` as a file entry backed by `FsFileOpener`. The
   directory contents are never walked.

2. **Dangling symlinks crash in work tree.** When `Deno.stat()` fails for a
   non-annex dangling symlink, `parseAnnexedFile()` throws an unhandled
   error.

3. **Unresolvable symlinks silently dropped in git tree.** Broken, cyclic,
   and out-of-tree symlinks produce no issue — the file simply does not appear
   in the tree.

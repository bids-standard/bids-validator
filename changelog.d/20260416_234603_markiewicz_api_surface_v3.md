### Changed

- Reorganized public API surface for v3. Library imports now use subpath-specific
  entry points (`/validate`, `/files`, `/filetree`, `/files/deno`, `/files/browser`,
  `/files/git`, `/issues`, `/output`, `/cli`). The root export (`.`) remains the
  CLI entry point.

### Added

- New public subpaths expose primitives for building custom file sources:
  `FileOpener`, `BIDSFile`, `FileTree`, `FileIgnoreRules`, `filesToTree`,
  `subtree`, `loadBidsIgnore`, `readBidsIgnore`, and cross-environment openers
  (`HTTPOpener`, `NullFileOpener`).
- `detectErrors()` is now part of the public surface under `/validate`.
- `UnknownIssueCodeError` — `DatasetIssues.add()` now throws a typed error
  (instead of a plain `Error`) when called with an unrecognized issue code.
- Stream helpers (`createUTF8Stream`, `streamFromUint8Array`, `streamFromString`,
  `UnicodeDecodeError`) exported from `/files` for custom opener authors.

### Deprecated

- `@bids/validator/main` — use `/validate`, `/files/browser`, `/files/git` instead.
  `main()` is preserved for back-compat; it has no replacement and will be removed
  in v4.
- `@bids/validator/options` — use `/validate` (types) and `/cli` (validateCommand)
  instead. `parseOptions()` is preserved for back-compat; it has no replacement and
  will be removed in v4.
- `readFileTree` and `BIDSFileDeno` re-exported from `/files` — use `/files/deno`
  instead.

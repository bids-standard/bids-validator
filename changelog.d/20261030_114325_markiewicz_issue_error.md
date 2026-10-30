### Added

- `IssueError`, exported from `@bids/validator/issues`, wraps an `Issue` thrown by
  file loaders. File openers may reject with one to report a finished issue.

### Fixed

- `.bvec` files whose rows differ in length now raise `BVEC_ROW_LENGTH` instead of
  being silently accepted.
- `MULTIPLE_INHERITABLE_FILES` issues now report `affects` as a list of paths, as other
  issues do.
- An I/O error while reading a `.tsv` file no longer aborts validation with
  `UnknownIssueCodeError`.

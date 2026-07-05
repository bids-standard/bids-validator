### Changed

- The `--prune` option removes opaque BIDS directories (`sourcedata/`, `derivatives/`, etc.)
  from the file tree, reducing processing time and memory usage.
  This option is incompatible with recursive validation and may cause unexpected
  behavior if pruned data are referenced by name or via symbolic links.

### Fixed

- `.dotfiles` and directories (such as `.git/`) are now pruned from the file tree,
  avoiding unnecessary IO operations and memory consumption.

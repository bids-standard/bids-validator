### Added

- `--git-ref [REF]` will validate a git tree at the given reference
  (tag, branch, tree or commit, defaulting to `HEAD`). Work trees and bare git
  repositories are supported. If omitted, the current directory will be used,
  including untracked files, preserving the default behavior.

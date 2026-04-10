### Added

- Report broken symbolic links as issues instead of crashing or silently ignoring.
  `.bidsignore`d links are not reported. If resolution is not implemented, warnings
  are issued instead of errors.

### Fixed

- Treat symbolic links to directories as directories instead of files.

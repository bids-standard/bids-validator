### Added

- `UNLOCKED_ANNEX_DATA` reports git-annex pointer files (unlocked annexed files), so
  archives can require locked datasets. ([#458](https://github.com/bids-standard/bids-validator/issues/458))
- `UNAVAILABLE_ANNEX_DATA` reports annexed files whose content cannot be retrieved.
- `--allowUnlockedData` validates the content of unlocked annexed files, retrieving it
  from git-annex remotes if needed.

### Changed

- Annexed files whose content cannot be retrieved are reported as
  `UNAVAILABLE_ANNEX_DATA` instead of being validated as empty files.

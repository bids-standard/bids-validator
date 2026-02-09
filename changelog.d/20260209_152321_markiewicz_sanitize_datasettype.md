### Fixed

- Validating directory names is now skipped for unknown `DatasetType`s in
  `dataset_description.json`. Previously this would crash, preventing the error
  in `DatasetType` values from being reported to the user.

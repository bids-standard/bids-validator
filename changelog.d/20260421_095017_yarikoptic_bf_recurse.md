### Changed

- Nested BIDS datasets discovered under `derivatives/`, `rawbids/`, or
  `sourcedata/` are now recursed into with `-r`, whether the container
  directory itself is a BIDS dataset (e.g. `rawbids/dataset_description.json`)
  or it holds one or more BIDS datasets as immediate subdirectories
  (e.g. `derivatives/fmriprep/dataset_description.json`,
  `sourcedata/ds00003/dataset_description.json`). The text output
  section previously labeled "Derivative:" is now "Nested dataset:".
  The `derivativesSummary` field on `ValidationResult` is preserved
  for API stability but now covers all nested BIDS datasets.  See
  [#390](https://github.com/bids-standard/bids-validator/pull/390).

### Fixed

- Normalize an invalid `DatasetType` value (not one of `raw`, `derivative`,
  `study`) to the spec default for internal rule lookups so
  `rules.directories[DatasetType]` resolves and downstream validation does
  not cascade into spurious `NOT_INCLUDED` errors on legitimate subjects.
  The original value in `dataset_description.json` is preserved so JSON
  schema validation still flags the invalid enum value.  See
  [#390](https://github.com/bids-standard/bids-validator/pull/390).

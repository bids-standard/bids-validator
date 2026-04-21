### Changed

- Nested BIDS datasets discovered under `derivatives/`, `rawbids/`, or
  `sourcedata/` are now recursed into with `-r`, whether the container
  directory itself is a BIDS dataset (e.g. `rawbids/dataset_description.json`)
  or it holds one or more BIDS datasets as immediate subdirectories
  (e.g. `derivatives/fmriprep/dataset_description.json`,
  `sourcedata/ds00003/dataset_description.json`). The text output
  section previously labeled "Derivative:" is now "Nested dataset:".
  The `derivativesSummary` field on `ValidationResult` is preserved
  for API stability but now covers all nested BIDS datasets.

### Changed

- Nested BIDS datasets discovered under `derivatives/`, `rawbids/`, or
  `sourcedata/` are now recursed into with `-r`, whether the container
  directory itself is a BIDS dataset (e.g. `rawbids/dataset_description.json`)
  or it holds one or more BIDS datasets as immediate subdirectories
  (e.g. `derivatives/fmriprep/dataset_description.json`,
  `sourcedata/ds00003/dataset_description.json`). In the returned
  `ValidationResult`, derivatives populate `derivativesSummary` (as
  before) and `rawbids/`/`sourcedata/` nested datasets populate the new
  `sourcesSummary` field. In text output they render as `Derivative:`
  and `Source:` sections respectively.  Sections are now printed in
  bottom-up order — Sources (`sourcedata/` before `rawbids/`) →
  Derivatives → Root dataset — so the parent dataset's status and a
  roll-up of nested errors/warnings appear at the end of the output.
  See [#390](https://github.com/bids-standard/bids-validator/pull/390).

### Fixed

- Normalize an invalid `DatasetType` value (not one of `raw`, `derivative`,
  `study`) to the spec default for internal rule lookups so
  `rules.directories[DatasetType]` resolves and downstream validation does
  not cascade into spurious `NOT_INCLUDED` errors on legitimate subjects.
  The original value in `dataset_description.json` is preserved so JSON
  schema validation still flags the invalid enum value.  See
  [#390](https://github.com/bids-standard/bids-validator/pull/390).

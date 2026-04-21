### Fixed

- Compute opaque directories from the rules for the dataset's actual
  `DatasetType` instead of always using `rules.directories.raw`.  This
  lets study-type datasets correctly ignore the `rawbids/`
  subdataset (added in
  [bids-standard/bids-specification#2191](https://github.com/bids-standard/bids-specification/pull/2191))
  and lets derivative-type datasets recognize derivative-only opaque
  directories (e.g. `template`, `cohort`).  See
  [#389](https://github.com/bids-standard/bids-validator/pull/389).

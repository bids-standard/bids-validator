### Fixed

- Compute opaque directories from the rules for the dataset's actual
  `DatasetType` instead of always using `rules.directories.raw`.  This
  lets study-type datasets correctly ignore the `rawbids/`
  subdataset (added in [bids-standard/bids-specification#2191][]).
  Fixed in [#389][].

[bids-standard/bids-specification#2191]: https://github.com/bids-standard/bids-specification/pull/2191
[#389]: https://github.com/bids-standard/bids-validator/pull/389

### Fixed

- Read `channels.tsv` associations in full, regardless of `--max-rows`.
  `*ChannelCount` checks (e.g. `ShortChannelCount`, `NIRSChannelCount`) no longer
  raise false errors on datasets with more than 1000 channels.

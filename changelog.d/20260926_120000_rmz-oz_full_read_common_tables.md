### Fixed

- Read tables matched by `rules.files.common` (`participants.tsv`, `samples.tsv`,
  `sessions.tsv`, `scans.tsv` and `phenotype/*.tsv`) in full, regardless of `--max-rows`.
  Datasets with more than 1000 subjects no longer raise a false `PARTICIPANT_ID_MISMATCH`.

### Fixed

- `_motion.tsv` files are now correctly parsed as headerless,
  with column names determined by the `name` column of the associated `channels.tsv`.
  This resolves spurious `TSV_COLUMN_HEADER_DUPLICATE` errors.

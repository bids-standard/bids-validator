### Fixed

- Headerless `_motion.tsv` files are no longer parsed as if their first row contained
  column headers, which produced spurious `TSV_COLUMN_HEADER_DUPLICATE` errors.
  Column names are now taken from the `name` column of the associated `channels.tsv`.

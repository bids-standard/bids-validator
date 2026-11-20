### Fixed

- Read full columns of associated TSV files into `associations` context without
  truncating to `--max-rows`. Various checks validate length or inclusion, and
  this avoids false errors for large files. The exception is `associations.events`,
  which can grow very large and is only checked for min/max onset, so it risks
  at most a falsely passed bounds check.

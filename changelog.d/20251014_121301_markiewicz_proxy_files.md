### Added

- Datalad/git-annex datasets with remote content in public S3 buckets can be validated
  with the `--preferredRemote <remote-name>` flag. If a public S3 bucket is detected without
  this flag, the most recent export is used.

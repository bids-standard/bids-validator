### Fixed

- Retrieval of remote data on S3 is now more robust, avoiding resource leaks
  by setting timeouts and a reasonable retry protocol.

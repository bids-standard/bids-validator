
<a id='changelog-2.0.2'></a>
# 2.0.2 — 2025-02-10

## Added

- Enable glob-style wildcards for `location` field in configuration files. (#134)

## Changed

- Ensure HED schemas are loaded only once, improving efficiency. (#156)

- Change the output of the `intersects()` function in the expression language
  to return the intersection, if non-empty.
  Corresponds to [bids-standard/bids-specification#2044]. (#150)

- Update to BIDS schema version 1.0.1 (BIDSVersion 1.10.0) (#152)

- Limit TSV validation to first 1000 rows by default,
  adding the `--max-rows` flag to control this behavior. (#139)

[bids-standard/bids-specification#2044]: https://github.com/bids-standard/bids-specification/pull/2044

## Fixed

- TSV files may now have columns named `set`, `clear`, `delete`, `keys`, or `value`.
  These were previously masked by the methods on the data structure
  representing columns. (#155)

- Improve handling of `.bidsignore` files in the web validator.
  Ignores matching directories but not the files they contained could fail to match.
  (#113)

- Resolve issue with parsing headers of NIfTI files with large extensions.
  Fixes [issue 126].

[issue 126]: https://github.com/bids-standard/bids-validator/issues/126

## Infrastructure

- Adopting [scriv](https://scriv.readthedocs.io/en/latest/) for changelog
  management.

<a id='changelog-2.0.1'></a>
# 2.0.1 — 2024-12-10

## Fixed

- Improve handling of `.bidsignore` files in the web validator.
  Ignores matching directories but not the files they contained could fail to match.
  (#113)

- Resolve issue with parsing headers of NIfTI files with large extensions.
  Fixes [issue 126].

[issue 126]: https://github.com/bids-standard/bids-validator/issues/126

## Infrastructure

- Adopting [scriv](https://scriv.readthedocs.io/en/latest/) for changelog
  management.

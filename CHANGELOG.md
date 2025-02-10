
<a id='changelog-2.0.2'></a>
# 2.0.2 — 2025-02-10

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


<a id='changelog-2.0.10'></a>
# 2.0.10 — 2025-08-29

## Added

- Added a [FAQ] to the user guide. ([#215])

[FAQ]: https://bids-validator.readthedocs.io/en/latest/user_guide/faq.html
[#215]: https://github.com/bids-standard/bids-validator/issues/215

## Changed

- Improved handling of TSV columns with sidecar definitions.
  `"Format"`, `"Minimum"` and `"Maximum"` keys are now supported.

- `--datasetTypes` and `--blacklistModalities` options now accept a string array (`--datasetTypes raw,derivative`) and can be combined.

## Fixed

- A crash in the web validator prevented validation from taking place.

## Infrastructure

- Docker images will once again be pushed to [bids/validator][].

[bids/validator]: https://hub.docker.com/r/bids/validator/

<a id='changelog-"2.0.9"'></a>
# "2.0.9" — 2025-08-26

## Added

- Display version in web app

- The `--datasetTypes` flag accepts a list of `DatasetType`s,
  allowing applications to restrict the datasets they accept.

## Changed

- Upgraded to BIDS schema version 1.0.13.

- Raise error when JSON files are parsed and their root value is anything other than an object

<a id='changelog-"2.0.8"'></a>
# "2.0.8" — 2025-08-07

## Added

- Support multi-inheritance for associated files.
  This will allow for multiple `electrodes.tsv` files,
  distinguished by the `space-` entity. ([#206] [#207])

[#206]: https://github.com/bids-standard/bids-validator/issues/206
[#207]: https://github.com/bids-standard/bids-validator/pull/207

<a id='changelog-2.0.7'></a>
# 2.0.7 — 2025-06-03

## Changed

- Handle TSV schema rules with missing or `n/a` values for `additional_columns`.

<a id='changelog-"2.0.6"'></a>
# "2.0.6" — 2025-05-23

## Added

- Explain the issue data fields in the documentation. ([#199])

[#199]: https://github.com/bids-standard/bids-validator/pull/199

## Changed

- Validator now returns exit code 16 instead of 1 for validation of a dataset with errors.

- Rely on `schema.meta.associations` to load context associations instead of relying on list maintained in validator.

## Fixed

- Sidecar checks are skipped for text files that should not have sidecars.
  This resolves a problem in derivative datasets, where BIDS specifies a
  RECOMMENDED field of `Description` in all derivative files. ([#202])

[#202]: https://github.com/bids-standard/bids-validator/issues/202
<a id='changelog-2.0.4'></a>
# 2.0.5 — 2025-03-31

A hot-fix release that adds missing entries to the 2.0.4 changelog and fixes publication to PyPI.

<a id='changelog-2.0.4'></a>
# 2.0.4 — 2025-03-31

## Added

- Validate directory names names according to `schema.rules.directories` entries.
  Use rules to identify "opaque" directories whose contents are unspecified by BIDS.
  ([#180])

[#180]: https://github.com/bids-standard/bids-validator/pull/180

- Report field descriptions for missing or invalid metadata. ([#177])

[#177]: https://github.com/bids-standard/bids-validator/pull/177

- Publish validator to PyPI as `bids-validator-deno`. ([#186])

[#186]: https://github.com/bids-standard/bids-validator/pull/186

## Changed

- Update to HED Validator 4.0.0. ([#173])

[#173]: https://github.com/bids-standard/bids-validator/pull/173

<a id='changelog-2.0.3'></a>
# 2.0.3 — 2025-02-24

## Fixed

- Subject detection in `participants.tsv` and `phenotype/` directories
  has been restored, enabling checks that were deactivated by the missing
  data. ([#162])

[#162]: https://github.com/bids-standard/bids-validator/pull/162

- Skip HED tests if schema cannot be loaded. This was exhibiting
  as a `HED_ERROR` with "cannot read property null". ([#160])

[#160]: https://github.com/bids-standard/bids-validator/pull/160

- `TSV_INCORRECT_VALUE_TYPE*` error messages now indicate that a match
  failed, instead of confusingly claim success. ([#165])

[#165]: https://github.com/bids-standard/bids-validator/pull/165

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

# Using the command line

The BIDS Validator may be run with the [Deno] runtime.
For detailed installation instructions, see [Deno - Installation][].
Deno is also available as a [conda-forge package](https://anaconda.org/conda-forge/deno).

## Installation

In general, there is no need to install Deno applications.
`deno run` allows running from the Javascript Repository:

```sh
deno run -ERN jsr:@bids/validator <dataset>
```

However, you can also install a lightweight script (into `$HOME/.deno/bin`):

```sh
deno install -ERN -g -n bids-validator jsr:@bids/validator
```

Or compile a bundled binary:

```sh
deno compile -ERN -o bids-validator jsr:@bids/validator
```

## Usage

The BIDS Validator takes a single dataset as input:

::::{tab-set}
:sync-group: run-method

:::{tab-item} Deno run
:sync: run

```sh
deno run -ERN jsr:@bids/validator <dataset>
```

:::
:::{tab-item} Installed
:sync: install

```sh
bids-validator <dataset>
```

:::
::::

### Options

| Option                         | Description                                                                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-v`, `--verbose`              | Log more extensive information about issues                                                                                                                           |
| `-s URL`, `--schema URL`       | Specify an alternative [BIDS Schema] for validation                                                                                                                   |
| `-c FILE`, `--config FILE`     | Provide a [configuration file](#configuration-file)                                                                                                                   |
| `-r`, `--recursive`            | Validate datasets found in `derivatives/` subdirectories, recursively                                                                                                 |
| `-o FILE`, `--outfile FILE`    | Write validation results to file.                                                                                                                                     |
| `--json`                       | Output results in machine-readable [JSON]                                                                                                                             |
| `--ignoreWarnings`             | Do not report warnings                                                                                                                                                |
| `--ignoreNiftiHeaders`         | Do not open NIfTI files, skipping any checks that rely on NIfTI header data                                                                                           |
| `--filenameMode`               | Perform filename checks only on newline-separated filenames read from [stdin]                                                                                         |
| `--blacklistModalities MOD...` | Raise error if passed modalities are detected in the dataset. Modalities may be any of `mri`, `eeg`, `ieeg`, `meg`, `beh`, `pet`, `micr`, `motion`, `nirs`, or `mrs`. |
| `--debug LEVEL`                | Enable logging at the specified level. Default level is `ERROR`. Levels include (from most to least verbose): `NOTSET`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`. |
| `--color`, `--no-color`        | Enable/disable color. The validator also respects the [NO_COLOR] and [FORCE_COLOR] environment variables.                                                             |

## Configuration file

The schema validator accepts a JSON configuration file that reclassifies issues as
warnings, errors or ignored.

```json
{
  "ignore": [
    { "code": "JSON_KEY_RECOMMENDED", "location": "/T1w.json" }
  ],
  "warning": [],
  "error": [
    { "code": "NO_AUTHORS" }
  ]
}
```

The issues are partial matches of the [Issues] that the validator accumulates.
Pass the `--json` flag to see the issues in detail.

[Deno]: https://deno.com/
[Deno - Installation]: https://docs.deno.com/runtime/getting_started/installation/
[JSON]: https://www.json.org/json-en.html
[BIDS Schema]: https://bidsschematools.readthedocs.io
[stdin]: https://en.wikipedia.org/wiki/Standard_streams
[NO_COLOR]: https://no-color.org
[FORCE_COLOR]: https://force-color.org
[Issues]: https://jsr.io/@bids/validator/doc/issues/~/Issue

# The BIDS Validator

The BIDS Validator is a web application, command-line utility,
and Javascript/Typescript library for assessing compliance with the
[Brain Imaging Data Structure][BIDS] standard.

## Getting Started

In most cases,
the simplest way to use the validator is to browse to the [BIDS Validator][] web page:

![The web interface to the BIDS Validator with the "Select Dataset Files" button highlighted.
(Dark theme)](docs/_static/web_entrypoint_dark.png#gh-dark-mode-only)
![The web interface to the BIDS Validator with the "Select Dataset Files" button highlighted.
(Light theme)](docs/_static/web_entrypoint_light.png#gh-light-mode-only)

The web validator runs in-browser, and does not transfer data to any remote server.

In some contexts, such as when working on a remote server,
it may be easier to use the command-line.
The BIDS Validator can be run with the [Deno] runtime
(see [Deno - Installation][] for detailed installation instructions):

```shell
deno run -ERN jsr:@bids/validator
```

Deno by default sandboxes applications like a web browser.
`-E`, `-R` and `-N` allow the validator to read environment variables,
local files, and network locations.

### Configuration file

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

The issues are partial matches of the `issues` that the validator accumulates.
Pass the `--json` flag to see the issues in detail.

### Development tools

From the repository root, use `./local-run` to run with all permissions enabled by default:

```shell
# Run from within the /bids-validator directory
cd bids-validator
# Run validator:
./local-run path/to/dataset
```

## Schema validator test suite

```shell
# Run tests:
deno test --allow-env --allow-read --allow-write src/
```

This test suite includes running expected output from bids-examples and may throw some expected failures for bids-examples datasets where either the schema or validator are misaligned with the example dataset while under development.

## Modifying and building a new schema

To modify the schema a clone of bids-standard/bids-specification will need to be made. README and schema itself live here https://github.com/bids-standard/bids-specification/tree/master/src/schema.

After changes to the schema have been made to a local copy the dereferenced single json file used by the validator will need to be built. The `bidsschematools` python package does this. It can be installed from pypi via pip or a local installation can be made. It lives in the specification repository here https://github.com/bids-standard/bids-specification/tree/master/tools/schemacode

The command to compile a dereferenced schema is `bst -v export --output src/schema.json` (this assumes you are in the root of the bids-specification repo). Once compiled it can be passed to the validator via the `-s` flag, `./bids-validator-deno -s <path to schema> <path to dataset>`

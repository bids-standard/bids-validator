# Deno based bids-validator

## Intro

This is a partial rewrite of the bids-validator JavaScript implementation designed to read the [bids-specification schema](https://github.com/bids-standard/bids-specification/tree/master/src/schema) to apply the majority of validation rules.

Deno is a JavaScript and TypeScript runtime that is used to run the schema based validator. Deno is simpler than Node.js and only requires one tool to use, the Deno executable itself. To install Deno, follow these [install instructions for your platform](https://deno.land/manual/getting_started/installation).

At the root of the repository there are two directories, `bids-validator` and `bids-validator-web`. These are separate npm packages, the Deno validator lives within the bids-validator package within the `src` directory.

## Usage

To use the latest validator hosted at https://deno.land/x/bids_validator, use the following command:

```console
$ deno run --allow-read --allow-env https://deno.land/x/bids_validator/bids-validator.ts path/to/dataset
```

Deno by default sandboxes applications like a web browser. `--allow-read` allows the validator to read local files, and `--allow-env` enables OS-specific features.

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

From the repository root, use `bids-validator/bids-validator-deno` to run with all permissions enabled by default:

```shell
# Run from within the /bids-validator directory
cd bids-validator
# Run validator:
./bids-validator-deno path/to/dataset
```

## Schema validator test suite

```shell
# Run tests:
deno test --allow-env --allow-read --allow-write src/
```

This test suite includes running expected output from bids-examples and may throw some expected failures for bids-examples datasets where either the schema or validator are misaligned with the example dataset while under development.

## Refreshing latest specification

If you are validating with the latest specification instead of a specific version, the validator will hold onto a cached version. You can request the newest version by adding the `--reload` argument to obtain the newest specification definition.

`deno run --reload=https://bids-specification.readthedocs.io/en/latest/schema.json src/main.ts`

## Modifying and building a new schema

To modify the schema a clone of bids-standard/bids-specification will need to be made. README and schema itself live here https://github.com/bids-standard/bids-specification/tree/master/src/schema.

After changes to the schema have been made to a local copy the dereferenced single json file used by the validator will need to be built. The `bidsschematools` python package does this. It can be installed from pypi via pip or a local installation can be made. It lives in the specification repository here https://github.com/bids-standard/bids-specification/tree/master/tools/schemacode

The command to compile a dereferenced schema is `bst -v export --output src/schema.json` (this assumes you are in the root of the bids-specification repo). Once compiled it can be passed to the validator via the `-s` flag, `./bids-validator-deno -s <path to schema> <path to dataset>`

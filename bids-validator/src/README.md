# Intro

This is a partial rewrite of the bids-validator JavaScript implementation designed to read the [bids-specification schema](https://github.com/bids-standard/bids-specification/tree/master/src/schema) to apply the majority of validation rules.

Deno is a JavaScript and TypeScript runtime that is used to run the schema based validator. Deno is simpler than Node.js and only requires one tool to use, the Deno executable itself. To install Deno, follow these [install instructions for your platform](https://deno.land/manual/getting_started/installation).

# Schema validator example

Deno by default sandboxes applications like a web browser. To validate datasets located on your local system, you need to use the --allow-read flag to read local files. --allow-env is also required to allow for detection of OS specific features.

```shell
# Build JavaScript validator for web/deno runtime (currently requied for hybrid validation)
# See parent directory for documentation on setup of the bids-validator for this step
npm run build
# Run validator:
deno run --allow-env --allow-read src/main.ts path/to/dataset
```

By default both the new schema derived validation rules and the legacy JavaScript rules are run to ensure full coverage. The validator can be limited to run only the schema dervied rules with the flag `--schemaOnly`.

```shell
deno run --allow-env --allow-read src/main.ts --schemaOnly path/to/dataset
```

# Schema validator test suite

```shell
# Run tests:
deno test --allow-env --allow-read src/
```

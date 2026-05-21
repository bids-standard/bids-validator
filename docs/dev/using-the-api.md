# Using the API

The BIDS Validator can be used as a library from Deno, Node, or the
browser, in addition to its [command-line interface](../user_guide/command-line.md).
This page covers programmatic use. The auto-generated API reference,
which is the source of truth for type signatures, is hosted on
[JSR](https://jsr.io/@bids/validator/doc).

## Installing

The validator is published to [JSR](https://jsr.io/@bids/validator) as
`@bids/validator`. From a Deno project:

```console
$ deno add jsr:@bids/validator
```

For Node and bundler-based projects, install via the JSR-to-npm bridge:

```console
$ npx jsr add @bids/validator
```

## A minimal example

The smallest useful program loads a dataset from disk into a `FileTree`
and runs `validate` against it:

```ts
import { readFileTree } from '@bids/validator/files/deno'
import { validate } from '@bids/validator/validate'

const datasetPath = '/path/to/dataset'
const tree = await readFileTree(datasetPath)
const result = await validate(tree, {
  datasetPath,
  debug: 'ERROR',
  datasetTypes: [],
  blacklistModalities: [],
})

console.log(`${result.issues.size} issues found`)
console.log(`Validated against schema ${result.summary.schemaVersion}`)
```

`readFileTree` requires read access to the dataset directory. In
practice the validator also reads the `BIDS_SCHEMA` environment
variable and may fetch a schema over the network, so the simplest
approach is to use the same permission set as the published CLI:

```sh
deno run -ERWN script.ts
```

If you want tighter scoping, grant only what the validator actually
needs: `-R=/path/to/dataset -E=BIDS_SCHEMA -W=/path/to/dataset -N=bids-specification.readthedocs.io`.

## Working with the result

`validate` returns a `ValidationResult`:

```ts
interface ValidationResult {
  issues: DatasetIssues
  summary: SummaryOutput
  derivativesSummary?: Record<string, ValidationResult>
}
```

- `issues` — a [`DatasetIssues`](https://jsr.io/@bids/validator/doc/issues/~/DatasetIssues)
  collection. Iterate over `result.issues.issues` to get the flat list,
  or call `result.issues.groupBy('code')` to group by issue type. See
  [Understanding issues](../user_guide/issues.md) for the issue model.
- `summary` — counts and metadata about the validated dataset
  (subjects, sessions, modalities, schema version).
- `derivativesSummary` — present only when `options.recursive` is set;
  maps each BIDS derivative dataset name to its own `ValidationResult`.

To enumerate every issue with its severity and location:

```ts
for (const issue of result.issues.issues) {
  console.log(`${issue.severity ?? 'error'}: ${issue.code} (${issue.location ?? 'no location'})`)
}
```

To filter by severity or code:

```ts
const errors = result.issues.filter({ severity: 'error' })
const missingFiles = result.issues.filter({ code: 'MISSING_DATASET_DESCRIPTION' })
```

## Browser and in-memory usage

In a browser, you typically have a `File[]` from a file input or
drag-and-drop event rather than a path on disk. Use `fileListToTree`
to construct a `FileTree` directly from the file list:

```ts
import { fileListToTree } from '@bids/validator/files/browser'
import { validate } from '@bids/validator/validate'

async function validateUserSelection(files: File[]) {
  const tree = await fileListToTree(files)
  return validate(tree, {
    datasetPath: '<browser-supplied dataset>',
    debug: 'ERROR',
    datasetTypes: [],
    blacklistModalities: [],
  })
}
```

`fileListToTree` lives in `src/files/browser.ts` and is re-exported from
`@bids/validator/main` for convenience.

## Entry points

The package exposes the following entry points (defined in `deno.json`):

| Import path                | Source                          | Purpose                                              |
| -------------------------- | ------------------------------- | ---------------------------------------------------- |
| `@bids/validator`          | `src/bids-validator.ts`         | CLI entry point — not intended for library use.      |
| `@bids/validator/main`     | `src/main.ts`                   | Library API: `validate`, `fileListToTree`, `getVersion`, `ValidationResult` type. |
| `@bids/validator/files`    | `src/files/deno.ts`             | Deno-side file-tree construction (`readFileTree`, `BIDSFileDeno`). |
| `@bids/validator/options`  | `src/setup/options.ts`          | `ValidatorOptions` and `Config` types; CLI option parser. |
| `@bids/validator/issues`   | `src/issues/datasetIssues.ts`   | `DatasetIssues` container and types.                 |
| `@bids/validator/output`   | `src/utils/output.ts`           | Result formatting (`consoleFormat`, `resultToJSONStr`). |

For full type signatures of every export, see the
[API reference on JSR](https://jsr.io/@bids/validator/doc).

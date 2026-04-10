# Development environment

This page covers setting up a local environment to develop and test the
BIDS Validator. For the higher-level fork-and-PR workflow, branching
policy, and changelog conventions, see [the contributing guide](contributing.md).

## Prerequisites

- [Deno](https://deno.com/) (the BIDS Validator targets the Deno runtime).
- [git](https://git-scm.com/).
- Optional: [`uv`](https://docs.astral.sh/uv/) so you can run Python
  tools like [`scriv`](https://scriv.readthedocs.io/) and
  [`pre-commit`](https://pre-commit.com/) via `uvx` without installing
  them globally.

## Cloning

Clone your fork of the repository (see [contributing.md](contributing.md)
for the full fork workflow):

```console
$ git clone https://github.com/<your-user>/bids-validator
$ cd bids-validator
```

## Test datasets (required for the full test suite)

Several tests exercise the validator against sample BIDS datasets that
live in a git submodule under `tests/data/bids-examples/` (about 60 MB).
Initialize it before running tests:

```console
$ git submodule update --init tests/data/bids-examples
```

## Running the CLI from source

You can run the validator directly from the source tree without installing
it. The same `-ERWN` permission flags used by the published CLI (see
[Using the command line](../user_guide/command-line.md)) work against the
source entry point:

```console
$ deno run -ERWN src/bids-validator.ts <path-to-dataset>
```

For example, against one of the example datasets:

```console
$ deno run -ERWN src/bids-validator.ts tests/data/bids-examples/ds001
```

The `-ERWN` shorthand grants the four permissions the validator needs:
environment variables (`-E`), filesystem read (`-R`), filesystem write
(`-W`), and network (`-N`). Using these specific flags is preferred over
`-A` (allow everything) because they document what the validator
actually needs.

## Installing the CLI locally

To install the validator as a regular `bids-validator` command on your
`PATH`:

```console
$ deno install -Agf --reload src/bids-validator.ts
```

Deno places the binary in its `bin` directory (typically
`$HOME/.deno/bin` on Unix systems), which you may need to add to your
`PATH`. The `-Agf` form here matches the existing
[contributing guide](contributing.md); to install with the same tighter
permissions used above for `deno run`, substitute
`-ERWNgf --reload` and the installed `bids-validator` will still work.

## Running tests

After initializing the `bids-examples` submodule (see above), run the
full test suite with:

```console
$ deno task test
```

This is equivalent to `deno test -A src/`. To run a single test file:

```console
$ deno test -A src/path/to/file.test.ts
```

## Formatting and linting

Format code with:

```console
$ deno fmt
```

Check formatting without modifying files:

```console
$ deno fmt --check
```

Lint with:

```console
$ deno lint
```

The `deno fmt` configuration in `deno.json` is scoped to the `src/`
directory; Markdown files under `docs/` are not auto-formatted by
`deno fmt`. Use your editor's Markdown formatter (or leave them alone
and match the surrounding style).

## Pre-commit hooks (recommended)

The repository ships with a [pre-commit](https://pre-commit.com/)
configuration that runs basic file hygiene checks (trailing whitespace,
end-of-file newlines, JSON/YAML/TOML syntax) and `deno fmt`. Install
the hooks once after cloning:

```console
$ uvx pre-commit install
```

After installation, the hooks run automatically on every `git commit`.

## Changelog fragments

Most pull requests should include a changelog entry. The repository uses
[scriv](https://scriv.readthedocs.io/) to manage changelog fragments
under `changelog.d/`. To create a fragment:

```console
$ uvx scriv create --edit
```

Pick the appropriate section (Added, Changed, Fixed, Deprecated, Removed,
Security, or Infrastructure) and write a one- to three-line description
of your change. See [contributing.md](contributing.md) for the full
changelog conventions.

## Schema development

If you need to develop against an unreleased version of the BIDS schema,
see the schema section of the [README](../../README.md).

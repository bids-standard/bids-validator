# Release process

This document is for package maintainers.
Most contributors should refer to the [Contributing Guide](contributing.md).

## Creating a release

First, update the version in `deno.json` to the desired version:

If you have [jq][] and [moreutils][] installed:

```bash
jq '.version="2.2.5"' deno.json | sponge deno.json
```

Build the changelog and edit as needed:

```bash
uvx scriv collect --edit
```

Finally, commit the changes and tag:

```bash
git add deno.json CHANGELOG.md changelog.d
git commit -m 'rel: 2.2.5'
git tag -a -F CHANGELOG.md -e 2.2.5
```

This will open an editor. The initial text will be the ful changelog, e.g.:

```markdown
# Changelog

<!-- scriv-insert-here -->

<a id='changelog-"2.2.5"'></a>
# "2.2.5" — 2025-12-10

## Added

- Support for template and cohort directories, as introduced in BEP038.

## Fixed

- The AMBIGUOUS_AFFINE issue was given an error message and set to warning.

- Very oblique affines are no longer considered ambiguous.

- Resolved TypeError when rendering issues for JSON outputs.

<a id='changelog-"2.2.4"'></a>
# "2.2.4" — 2025-12-05

[...]
```

Remove preamble, HTML and quotes around the version, as well as heading markers,
which git will interpret as comments:

```markdown
2.2.5 — 2025-12-10

Added

- Support for template and cohort directories, as introduced in BEP038.

Fixed

- The AMBIGUOUS_AFFINE issue was given an error message and set to warning.
- Very oblique affines are no longer considered ambiguous.
- Resolved TypeError when rendering issues for JSON outputs.
```

Save and quit. Push to upstream:

```bash
git push upstream main --tags
```

Once CI passes, bump the development version, merge into the dev branch,
and push:

```bash
jq '.version="2.2.6-dev"' deno.json | sponge deno.json
git add deno.json
git commit -m 'chore: 2.2.6-dev'
git checkout dev
git merge -X ours main
git checkout main
git push upstream main dev
```

Finally, trigger an update of the web validator by
[creating a release](https://github.com/bids-standard/bids-validator/releases/new) on GitHub.

[jq]: https://jqlang.org/
[moreutils]: https://joeyh.name/code/moreutils/

## Fixing wheels

We generate [wheels](https://pythonwheels.com/) for distribution on PyPI as the
[bids-validator-deno](https://pypi.org/project/bids-validator-deno/) package.
The infrastructure for doing so is almost entirely separate from the Javascript package,
so it may not be necessary to create a new release to fix the issue and upload wheels.

To fix this, branch off of the tag that needs releasing using the `wheel/<version>` branch:

```bash
git checkout 2.2.6 -b wheel/2.2.6
```

Merge in the latest existing `wheel/*` branch to use the adapted CI:

```bash
git branch --list 'wheel/*'  # See wheel/2.2.5 as most recent
git merge wheel/2.2.5
```

Make any additional changes, and push to upstream:

```bash
git push -u upstream wheel/2.2.6
```

The CI is set up to be fault tolerant.
Any wheels that are successfully built that were not previously uploaded will be uploaded.
Any duplicates will be ignored. You can iteratively fix wheels.

To the extent possible, patch `main` as well before the next release, to make fixes less necessary.

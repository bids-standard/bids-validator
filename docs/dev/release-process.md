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

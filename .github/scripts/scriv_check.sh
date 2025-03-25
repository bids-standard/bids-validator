#!/usr/bin/env bash
# Modified from https://github.com/tarides/changelog-check-action/tree/main

set -uo pipefail

if [ "${NO_CHANGELOG_LABEL}" = "true" ]; then
    # 'no changelog' set, so finish successfully
    exit 0
else
    # a changelog check is required
    # fail if the diff is empty
    if git diff --exit-code "origin/${BASE_REF}" -- "changelog.d/"; then
        cat <<END >&2
User-visible changes should come with an entry in the changelog.
Create a changelog blurb with "uvx scriv create --edit".
If no changelog entry is needed, then set the "no changelog" label.
END
        exit 1
    fi
fi

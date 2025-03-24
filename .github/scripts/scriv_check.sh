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
        echo >&2 "User-visible changes should come with an entry in the changelog. This behavior
can be overridden by using the \"no changelog\" label."
        exit 1
    fi
fi

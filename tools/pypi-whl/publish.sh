#!/usr/bin/env bash
# publish.sh

# This script publishes the built wheel if the current tag corresponds to a version tag
# It requires the tag to be passed as the `TAG` environment variable

# Fail as soon as any command fails
set -euo pipefail

# Check if the tag is a release version tag
set +e
jq -e ".version[:1] != \"v\" and .version==\"$TAG\"" ../../deno.json
ret=$?
set -e
if [ $ret -eq 0 ]; then
    # Tag is a release version tag
    twine upload --verbose dist/*.whl
elif [ $ret -eq 1 ]; then
    # Tag is not a release version tag
    echo "Not releasing ($TAG is not a release version tag)"
else
    # jq command failed
    echo "jq command failed with exit code $ret"
    exit $ret
fi

#!/usr/bin/env bash
# validate_wheel.sh

# This script is used to validate the built wheel by installing it in a virtual
# environment, running the installed packaged, and ascertaining that the deno-compiled
# BIDS validator binary is correctly installed in the script or bin directory of the
# virtual environment.

# Fail as soon as any command fails
set -euo pipefail

python -m venv .venv

if [[ "$RUNNER_OS" == "Windows" ]]; then
    BIDS_VALIDATOR_BINARY_NAME="bids-validator.exe"
    VENV_BIN_DIR=".venv/Scripts"
else
    BIDS_VALIDATOR_BINARY_NAME="bids-validator"
    VENV_BIN_DIR=".venv/bin"
fi

# Activate the virtual environment
source "$VENV_BIN_DIR"/activate

# Install the built wheel
pip install dist/*.whl

# Smoke test with the `--version` option
bids-validator --version

# Display the script or bin directory of the virtual environment
ls -lh "$VENV_BIN_DIR"

# diff to confirm the binary is correctly installed
diff "$VENV_BIN_DIR"/"$BIDS_VALIDATOR_BINARY_NAME" dist/"$BIDS_VALIDATOR_BINARY_NAME"
# Deactivate environment
deactivate

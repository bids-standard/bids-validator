import json
import os
import subprocess

from deno import find_deno_bin

BUNDLE_JS = "bids-validator.js"
PERMISSIONS = [
    "--allow-read",  # read BIDS datasets
    "--allow-env",  # read environment variables
    "--allow-net",  # fetch remote schemas/datasets
    "--allow-write",  # write validation results
    "--allow-run=git",  # run git to read version info
]
WINDOWS_PERMISSIONS = [
    "--allow-sys=osRelease",  # Terminal capability detection
]


def pdm_build_initialize(context):
    # Version always comes from deno.json (sdist and wheel).
    deno_json = context.root / "deno.json"
    deno_config = json.loads(deno_json.read_text())
    context.config.metadata["version"] = deno_config["version"]

    if context.target == "sdist":
        return

    build_dir = context.ensure_build_dir()
    package_dir = build_dir / "bids_validator_deno"
    package_dir.mkdir(parents=True, exist_ok=True)

    bundle = package_dir / BUNDLE_JS
    init = package_dir / "__init__.py"

    init.write_text(INIT_PY)

    deno = os.fsdecode(find_deno_bin())

    # `deno bundle` resolves jsr/npm/wasm deps (network at build time) and
    # inlines them into a single platform-independent JS file plus a linked
    # source map (bundle.js.map). `--frozen` fails rather than silently
    # re-resolving if the committed deno.lock is out of date.
    subprocess.run(
        [
            deno,
            "bundle",
            "--frozen",
            "--sourcemap",
            "-o",
            str(bundle),
            "src/bids-validator.ts",
        ],
        check=True,
        cwd=context.root,
    )


INIT_PY = f'''\
# This module was generated at build time by pdm_build.py.
#
# This module was adapted from git-annex-wheel/src/git_annex/__init__.py @ commit 9a059be:
#
# https://github.com/psychoinformatics-de/git-annex-wheel/blob/9a059be12db8b90cb1ecf71e498d3a2135366b6f/src/git_annex/__init__.py
# https://hub.datalad.org/git-annex/git-annex-wheel/src/commit/9a059be12db8b90cb1ecf71e498d3a2135366b6f/src/git_annex/__init__.py
#
# By agreement of the authors of that module, releasing this derivative work under MIT is
# authorized. See https://github.com/bids-standard/bids-validator/pull/425.
#
# Changes:
#   * Adapted cli() to find Deno bundled in a separate package and exec the local bundle.
#
"""Find the deno runtime and exec the bundled BIDS validator."""
import os
import sys

def cli():
    from deno import find_deno_bin

    deno = os.fsdecode(find_deno_bin())
    windows = sys.platform.startswith('win')
    bundle = os.path.join(os.path.dirname(__file__), {BUNDLE_JS!r})

    permissions = {PERMISSIONS}
    if windows:
        permissions.extend({WINDOWS_PERMISSIONS})

    argv = [deno, *permissions, bundle, *sys.argv[1:]]

    if windows:
        exec_subproc(deno, argv)
    else:
        os.execv(deno, argv)


def exec_subproc(executable, argv):
    import subprocess

    try:
        subprocess.run(
            argv,
            executable=executable,
            shell=False,
            check=True,
        )
        # try flush here to trigger a BrokenPipeError within the try-except block
        # (happens if the calling process closed stdout already)
        sys.stdout.flush()
    except BrokenPipeError:
        # setting to None prevents Python from trying to flush again
        sys.stdout = None
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
'''

import json
import shutil
import subprocess
import sysconfig


def pdm_build_initialize(context):
    context.ensure_build_dir()

    deno_json = context.root / "deno.json"
    deno_config = json.loads(deno_json.read_text())
    context.config.metadata["version"] = deno_config["version"]

    if context.target == "sdist":
        return

    # Inject compiled binary into scripts/, so it will be picked up to install
    target = context.root / "scripts" / "bids-validator-deno"

    deno = shutil.which("deno")
    if deno is None:
        raise OSError("Deno is not installed or not in PATH")

    subprocess.run(
        [
            deno,
            "compile",
            "-ERNW",
            "--allow-run",
            # Types are checked elsewhere. Type checking at wheel build
            # is painful if some platforms have newer typescript than others.
            "--no-check",
            "-o",
            str(target),
            "src/bids-validator.ts",
        ],
        check=True,
    )

    # Add the current platform tag so the wheel is specific to the OS/architecture
    platform_tag = sysconfig.get_platform().replace("-", "_").replace(".", "_")
    context.config_settings["--plat-name"] = platform_tag

import gitmeta from './.git-meta.json' with { type: 'json' }
import denojson from '../deno.json' with { type: 'json' }
import { dirname } from '@std/path'

/**
 * Determine the version of the currently running script.
 *
 * The version is determined by the following rules:
 *
 * 1. Search for a hard-coded version populated by git-archive or the build.
 * 2. If the script is running from a local file, the version is determined by
 *    the output of `git describe --tags --always` in the script's directory.
 * 3. Fall back to the static metadata in `deno.json`, which should correspond
 *    to the most recent dev tag.
 *
 * @returns The version of the script.
 */
export async function getVersion(): Promise<string> {
  // Hard-coded JSON wins
  let version = getArchiveVersion()
  if (version) return version

  // Local git repository
  const url = new URL(Deno.mainModule)
  if (url.protocol === 'file:') {
    version = await getLocalVersion(dirname(url.pathname))
    if (version) return version
  }

  // Fall back to static metadata
  return denojson.version
}

async function getLocalVersion(path: string): Promise<string> {
  // safe.directory setting so we could still operate from another user
  try {
    const command = new Deno.Command('git', {
      args: ['-C', path, '-c', 'safe.directory=*', 'describe', '--tags', '--always'],
    })
    const { success, stdout } = await command.output()
    const description = new TextDecoder().decode(stdout).trim()
    return description
  } catch (err) {
    return ''
  }
}

function getArchiveVersion(): string | undefined {
  if (!gitmeta.description.startsWith('$Format:')) {
    return gitmeta.description
  }
  return undefined
}

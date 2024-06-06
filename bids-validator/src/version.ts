export async function getVersion(): string {
  const url = import.meta.url
  if (url.startsWith('file://')) {
    // Get parent directory of current file, without file:/
    const parent = url.slice(7).split('/').slice(0, -1).join('/')
    return await getLocalVersion(parent)
  } else if (url.startsWith('https://deno.land/x/')) {
    // Retrieve version X from https://deno.land/x/bids-validator@X/version.ts
    return url.split('@')[1].split('/')[0]
  } else if (url.startsWith('https://raw.githubusercontent.com')) {
    // Retrieve version X from https://raw.githubusercontent.com/bids-standard/bids-validator/X/bids-validator/src/version.ts
    return url.split('/bids-validator/')[1]
  }
  return url
}

export async function getLocalVersion(path: string): string {
  const p = Deno.run({
    cmd: ['git', 'describe', '--tags', '--always'],
    stdout: 'piped',
    stderr: 'piped',
    cwd: path,
  })
  const description = new TextDecoder().decode(await p.output()).trim()
  return description
}

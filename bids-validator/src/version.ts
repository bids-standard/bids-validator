export function getVersion(): string {
  const url = import.meta.url
  if (url.startsWith('file://')) {
    return 'local'
  } else if (url.startsWith('https://deno.land/x/')) {
    // Retrieve version X from https://deno.land/x/bids-validator@X/version.ts
    return url.split('@')[1].split('/')[0]
  } else if (url.startsWith('https://raw.githubusercontent.com')) {
    // Retrieve version X from https://raw.githubusercontent.com/bids-standard/bids-validator/X/bids-validator/src/version.ts
    return url.split('/bids-validator/')[1]
  }
  return url
}

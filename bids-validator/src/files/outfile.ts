export function stringToFile(s: string, path: string) {
  if (globalThis.Deno) {
    denoStringToFile(s, path)
  } else {
    browserStringToFile(s, path)
  }
}

function denoStringToFile(s: string, path: string) {
  Deno.writeTextFileSync(path, s)
}

/* path doesn't make much sense here. Should be just a filename. */
function browserStringToFile(s: string, path: string) {
  console.log(s)
}

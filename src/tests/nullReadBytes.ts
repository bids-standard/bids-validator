export const nullReadBytes = (size: number, offset = 1024) => {
  return Promise.resolve(new Uint8Array())
}

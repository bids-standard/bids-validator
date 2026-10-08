export const nullReadBytes = (_size: number, _offset = 1024) => {
  return Promise.resolve(new Uint8Array())
}

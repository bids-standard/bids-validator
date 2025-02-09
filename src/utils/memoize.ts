export type WithCache<T> = T & { cache: Map<string, any> }
interface FileLike {
  path: string
  parent: { path: string }
}

export const memoize = <T>(
  fn: (...args: any[]) => T,
): WithCache<(...args: any[]) => T> => {
  const cache = new Map()
  const cached = function (this: any, val: T) {
    return cache.has(val) ? cache.get(val) : cache.set(val, fn.call(this, val)) && cache.get(val)
  }
  cached.cache = cache
  return cached
}

export function filememoizeAsync<F extends FileLike, T>(
  fn: (file: F, ...args: any[]) => Promise<T>,
): WithCache<(file: F, ...args: any[]) => Promise<T>> {
  const cache = new Map<string, Map<string, T>>()
  const cached = async function (this: any, file: F, ...args: any[]): Promise<T> {
    let subcache = cache.get(file.parent.path)
    if (!subcache) {
      subcache = new Map()
      cache.set(file.parent.path, subcache)
    }
    const key = `${file.path}:${args.join(',')}`
    let val = subcache.get(key)
    if (!val) {
      val = await fn.call(this, file, ...args)
      subcache.set(key, val)
    }
    return val
  }
  cached.cache = cache
  return cached
}

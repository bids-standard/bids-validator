export type WithCache<T> = T & { cache: Map<any, any> }
interface FileLike {
  path: string
  parent: { path: string }
}

export const memoize = <T>(
  fn: (...args: any[]) => T,
  resolver?: (...args: any[]) => any,
): WithCache<(...args: any[]) => T> => {
  const cache = new Map()
  const cached = function (this: any, ...args: any[]) {
    const key = resolver ? resolver(...args) : JSON.stringify(args)
    return cache.has(key) ? cache.get(key) : cache.set(key, fn.apply(this, args)) && cache.get(key)
  }
  cached.cache = cache
  return cached
}

export function filememoize<F extends FileLike, T>(
  fn: (file: F, ...args: any[]) => T,
): WithCache<(file: F, ...args: any[]) => T> {
  const cache = new Map<string, Map<string, T>>()
  const cached = function (this: any, file: F, ...args: any[]): T {
    let subcache = cache.get(file.parent.path)
    if (!subcache) {
      subcache = new Map()
      cache.set(file.parent.path, subcache)
    }
    const key = `${file.path}:${args.join(',')}`
    let val = subcache.get(key)
    if (!val) {
      val = fn.call(this, file, ...args)
      subcache.set(key, val)
    }
    return val
  }
  cached.cache = cache
  return cached
}

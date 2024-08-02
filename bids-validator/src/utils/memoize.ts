export type WithCache<T> = T & { cache: Map<string, any> }
interface HasParent {
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

export function filememoizeAsync<F extends HasParent, T>(
  fn: (file: F) => Promise<T>,
): WithCache<(file: F) => Promise<T>> {
  const cache = new Map<string, Map<F, T>>()
  const cached = async function (this: any, file: F): Promise<T> {
    let subcache = cache.get(file.parent.path)
    if (!subcache) {
      subcache = new Map()
      cache.set(file.parent.path, subcache)
    }
    let val = subcache.get(file)
    if (!val) {
      val = await fn.call(this, file)
      subcache.set(file, val)
    }
    return val
  }
  cached.cache = cache
  return cached
}

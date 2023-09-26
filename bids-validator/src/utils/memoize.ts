export const memoize = <T>(
  fn: (...args: any[]) => T,
): ((...args: any[]) => T) => {
  const cache = new Map()
  const cached = function (this: any, val: T) {
    return cache.has(val)
      ? cache.get(val)
      : cache.set(val, fn.call(this, val)) && cache.get(val)
  }
  cached.cache = cache
  return cached
}

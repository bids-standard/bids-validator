export const memoize = <T = any>(fn: Function<T>) => {
  const cache = new Map()
  const cached = function (this: any, val: T) {
    return cache.has(val)
      ? cache.get(val)
      : cache.set(val, fn.call(this, val)) && cache.get(val)
  }
  cached.cache = cache
  return cached
}

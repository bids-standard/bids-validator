// Allow ColumnsMap to be accessed as an object too
export class ColumnsMap extends Map<string, string[]> {
  [key: string]: Map<string, string[]>[keyof Map<string, string[]>] | string[]
  constructor() {
    super()
    const columns = new Map<string, string[]>() as ColumnsMap
    return new Proxy<ColumnsMap>(columns, columnMapAccessorProxy)
  }
}

// Proxy handler to implement ColumnsMapType
export const columnMapAccessorProxy = {
  get: function (target: ColumnsMap, prop: any) {
    if (prop === Symbol.iterator) return target[Symbol.iterator].bind(target)
    else return target.get(prop)
  },
  set: function (target: ColumnsMap, prop: string, value: string[]) {
    target.set(prop, value)
    return true
  },
}

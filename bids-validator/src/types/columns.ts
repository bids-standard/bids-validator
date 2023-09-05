import { PropertyComparer } from 'https://deno.land/x/ts_morph@14.0.0/common/ts_morph_common.js'

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
  get: function (
    target: ColumnsMap,
    prop: symbol | string,
    receiver: ColumnsMap,
  ) {
    if (prop === Symbol.iterator) {
      return target[Symbol.iterator].bind(target)
    } else {
      return Reflect.get(target, prop, receiver)
    }
  },
  set: function (target: ColumnsMap, prop: string, value: string[]) {
    return Reflect.set(target, prop, value)
  },
  ownKeys: function (target: ColumnsMap) {
    return Reflect.ownKeys(target)
  },
}

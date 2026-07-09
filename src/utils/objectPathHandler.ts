// https://stackoverflow.com/questions/67849097/typescript-type-narrowing-not-working-when-looping
export const hasProp = <K extends PropertyKey, T>(
  obj: T,
  prop: K,
): obj is T & Record<K, unknown> => {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

export const objectPathHandler = {
  get(target: unknown, property: string) {
    let res = target
    if (typeof property === 'symbol') {
      return res
    }
    for (const prop of property.split('.')) {
      if (hasProp(res, prop)) {
        res = res[prop]
      } else {
        return undefined
      }
    }
    return res
  },
  deleteProperty(target: unknown, property: string): boolean {
    if (typeof property === 'symbol') {
      return true
    }
    const props = property.split('.')
    const toDelete = props.pop()
    if (toDelete === undefined) {
      return true
    }
    let parent = target
    for (const prop of props) {
      if (hasProp(parent, prop)) {
        parent = parent[prop]
      } else {
        return true
      }
    }
    return delete (parent as Record<string, unknown>)[toDelete]
  }
}

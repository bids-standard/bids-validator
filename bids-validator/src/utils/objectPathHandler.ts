export const objectPathHandler = {
  get(target, property) {
    let res = target
    for (const prop of property.split('.')) {
      res = res[prop]
    }
    return res
  },
}

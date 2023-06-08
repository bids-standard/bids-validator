function exists(list: string[], val: string = 'dataset'): number {
  if (!Array.isArray(list)) {
    list = [list]
  }
  if (val == 'stimuli') {
    return list.filter((x) => {
      const parts = ['stimuli', ...x.split('/')]
      // @ts-expect-error
      return this.fileTree.contains(parts)
    }).length
  }
  if (val == 'dataset') {
    let ret = list.filter((x) => {
      let parts = x.split('/')
      if (['.', ''].includes(parts[0])) {
        parts = parts.slice(1, parts.length)
      }
      return this.fileTree.contains(parts)
    })
    return ret.length
  }
  // XXX fallback to "always true" until this is actually complete
  return list.length
}

export const expressionFunctions = {
  intersects: <T>(a: T[], b: T[]): boolean => {
    return a.some((x) => b.includes(x))
  },
  match: (target: string, regex: string): boolean => {
    let re = RegExp(regex)
    return target.match(re) !== null
  },
  type: <T>(operand: T): string => {
    if (Array.isArray(operand)) {
      return 'array'
    }
    if (typeof operand === 'undefined') {
      return 'null'
    }
    return typeof operand
  },
  min: (list: number[]): number => {
    return Math.min(...list)
  },
  max: (list: number[]): number => {
    return Math.max(...list)
  },
  length: <T>(list: T[]): number | null => {
    if (Array.isArray(list) || typeof list == 'string') {
      return list.length
    }
    return null
  },
  count: <T>(list: T[], val: T): number => {
    return list.filter((x) => x === val).length
  },
  exists: exists,
  substr: (arg: string, start: int, end: int): str => {
    return arg.substr(start, end - start)
  },
}

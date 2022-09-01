export const expressionFunctions = {
  intersects: <T>(a: T[], b: T[]): boolean => {
    return a.any((x) => b.includes(x))
  },
  match: (target: string, regex: sting): boolean => {
    return target.match(regex)
  },
  type: <T>(operand: T): string => {
    return
  },
  min: (list: number[]): number => {
    return Math.min(...list)
  },
  max: (list: number[]): number => {
    return Math.max(...list)
  },
  length: <T>(list: T[]): number => {
    return list.length
  },
  count: <T>(list: T[], val: T): number => {
    return list.filter((x) => x === val).length
  },
}

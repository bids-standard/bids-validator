import type { BIDSContext } from './context.ts'
import { memoize } from '../utils/memoize.ts'

function exists(this: BIDSContext, list: string[], rule: string = 'dataset'): number {
  if (list == null) {
    return 0
  }

  const prefix: string[] = []
  const fileTree = rule == 'file' ? this.file.parent : this.dataset.tree

  // Stimuli and subject-relative paths get prefixes
  if (rule == 'stimuli') {
    prefix.push('stimuli')
  } else if (rule == 'subject') {
    prefix.push('sub-' + this.entities.sub)
  }

  if (!Array.isArray(list)) {
    list = [list]
  }
  if (rule == 'bids-uri') {
    return list.filter((x) => {
      // XXX To implement
      if (x.startsWith('bids:')) {
        return true
      }
      return false
    }).length
  } else {
    // dataset, subject and stimuli
    return list.filter((x) => {
      const parts = prefix.concat(x.split('/'))
      return fileTree.contains(parts)
    }).length
  }
}

export const expressionFunctions = {
  index: <T>(list: T[], item: T): number | null => {
    const index = list.indexOf(item)
    return index != -1 ? index : null
  },
  intersects: <T>(a: T[], b: T[]): T[] | boolean => {
    // Tolerate single values
    if (!Array.isArray(a)) {
      a = [a]
    }
    if (!Array.isArray(b)) {
      b = [b]
    }
    // Construct a set from the smaller list
    if (a.length < b.length) {
      const tmp = a
      a = b
      b = tmp
    }
    if (b.length === 0) {
      return false
    }

    const bSet = new Set(b)
    const intersection = a.filter((x) => bSet.has(x))
    if (intersection.length === 0) {
      return false
    }
    return intersection
  },
  match: (target: string, regex: string): boolean => {
    const re = RegExp(regex)
    return target.match(re) !== null
  },
  type: <T>(operand: T): string => {
    if (Array.isArray(operand)) {
      return 'array'
    }
    if (typeof operand === 'undefined' || operand === null) {
      return 'null'
    }
    return typeof operand
  },
  min: (list: number[]): number | null => {
    return list != null ? Math.min(...list.map(Number).filter((x) => !isNaN(x))) : null
  },
  max: (list: number[]): number | null => {
    return list != null ? Math.max(...list.map(Number).filter((x) => !isNaN(x))) : null
  },
  length: <T>(list: T[]): number | null => {
    if (Array.isArray(list) || typeof list == 'string') {
      return list.length
    }
    return null
  },
  unique: <T>(list: T[]): T[] | null => {
    if (list !== null) {
      return [...new Set(list)]
    }
    return null
  },
  count: <T>(list: T[], val: T): number => {
    return list.filter((x) => x === val).length
  },
  exists: exists,
  substr: (arg: string, start: number, end: number): string | null => {
    if (arg == null || start == null || end == null) {
      return null
    }
    return arg.substr(start, end - start)
  },
  sorted: <T>(list: T[], method: string = 'auto'): T[] => {
    const cmp = {
      numeric: (a: T, b: T) => {
        return Number(a) - Number(b)
      },
      lexical: (a: T, b: T) => {
        return String(a).localeCompare(String(b))
      },
      auto: (a: T, b: T) => {
        return +(a > b) - +(a < b)
      },
    }[method]
    return list.toSorted(cmp)
  },
  allequal: <T>(a: T[], b: T[]): boolean => {
    return (a != null && b != null) && a.length === b.length && a.every((v, i) => v === b[i])
  },
}

/**
 * Generate a function that evaluates an expression using the BIDS context.
 */
function _contextFunction(expr: string): (context: BIDSContext) => any {
  return new Function('context', `with (context) { return ${expr.replace(/\\/g, '\\\\')} }`) as (
    context: BIDSContext,
  ) => any
}

/**
 * Generate a function that evaluates an expression using the BIDS context.
 */
export const contextFunction = memoize(_contextFunction)

function _formatter(format: string): (context: BIDSContext) => string {
  if (!format.includes('{')) {
    return (context: BIDSContext) => format
  }
  const template = format.replace(/{/g, '${').replace(/\\/g, '\\\\').replace(/`/g, '\\`')
  return new Function('context', `with (context) { return \`${template}\` }`) as (
    context: BIDSContext,
  ) => string
}

/**
 * Generate a function that formats a string using the BIDS context.
 *
 * Strings are expected to use Python-style formatting,
 * e.g., "sub-{entities.sub}/ses-{entities.ses}".
 */
export const formatter = memoize(_formatter)

function safeContext(context: BIDSContext): BIDSContext {
  return new Proxy(context, {
    has: () => true,
    get: (target: any, prop: any) => prop === Symbol.unscopables ? undefined : target[prop],
  })
}

export function prepareContext(context: BIDSContext): BIDSContext {
  Object.assign(context, expressionFunctions)
  // @ts-expect-error
  context.exists.bind(context)
  return safeContext(context)
}

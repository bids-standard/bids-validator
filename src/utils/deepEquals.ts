export function deepEquals<T>(a: T, b: T): boolean {
  if (a === b) return true
 
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }
 
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false
    }
    return true
  } else if (Array.isArray(a) || Array.isArray(b)) {
    return false
  }
 
  const aKeys = Object.keys(a) as (keyof T)[]
  const bKeys = Object.keys(b) as (keyof T)[]
 
  if (aKeys.length !== bKeys.length) {
    return false
  }
 
  for (const aKey of aKeys) {
    if (!(aKey in b) || !deepEquals(a[aKey], b[aKey])) {
      return false
    }
  }
 
  return true;
}

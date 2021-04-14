import * as schemaRegex from '../schemas/regex.json'

let regexStrs = schemaRegex.default
console.log()
const regexes = Object.values(regexStrs)
  .flat()
  .map(regexStr => {
    return new RegExp(regexStr)
  })

export const _isBids = path => {
  return regexes.some(regex => {
    return !!regex.exec(path)
  })
}

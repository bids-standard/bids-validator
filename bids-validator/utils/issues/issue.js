import issues from './list'

/**
 * Help Url
 *
 * Construct a link to a helpful neurostars query, based on the
 * issue key
 */
const constructHelpUrl = issue => {
  const neurostarsPrefix = 'https://neurostars.org/'
  const searchQuery = issue && issue.key ? 'search?q=' + issue.key : ''
  const helpUrl = neurostarsPrefix + searchQuery
  return helpUrl
}

/**
 * Issue
 *
 * A constructor for BIDS issues.
 */
export default function(options) {
  const code = options.hasOwnProperty('code') ? options.code : null
  const issue = issues[code]

  this.key = issue.key
  this.code = code
  this.file = options.hasOwnProperty('file') ? options.file : null
  this.evidence = options.hasOwnProperty('evidence') ? options.evidence : null
  this.line = options.hasOwnProperty('line') ? options.line : null
  this.character = options.hasOwnProperty('character')
    ? options.character
    : null
  this.severity = options.hasOwnProperty('severity')
    ? options.severity
    : issue.severity
  this.reason = options.hasOwnProperty('reason') ? options.reason : issue.reason
  this.helpUrl = constructHelpUrl(issue)
}

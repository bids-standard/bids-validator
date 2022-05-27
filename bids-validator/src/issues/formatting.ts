import { Issue } from '../types/issues.ts'

const neurostarsPrefix = 'https://neurostars.org/'

/**
 * Help Url
 *
 * Construct a link to a helpful neurostars query, based on the
 * issue key
 */
export const constructHelpUrl = (key: string): string =>
  `${neurostarsPrefix}search?q=${key}`

/**
 * Utilities for formatting human readable output (CLI or other UIs)
 */
import { Table } from '@cliffy/table'
import * as colors from '@std/fmt/colors'
import { format as prettyBytes } from '@std/fmt/bytes'
import { marked } from 'marked'
import pluralize from 'pluralize'
import supportsHyperlinks from 'supports-hyperlinks'
import ansiEscapes from 'ansi-escapes'
import type { SummaryOutput, ValidationResult } from '../types/validation-result.ts'
import type { Issue, Severity } from '../types/issues.ts'
import type { DatasetIssues } from '../issues/datasetIssues.ts'

interface LoggingOptions {
  verbose: boolean
}

/**
 * Format for Unix consoles
 *
 * Returns the full output string with newlines.
 *
 * Output order: nested datasets first (Sources before Derivatives;
 * within Sources, `sourcedata/` entries before `rawbids/`), then the
 * root dataset itself with a roll-up of nested-dataset issue counts.
 * The root section comes last so a quick `tail` shows the
 * top-level dataset's status and aggregate health at a glance.
 */
export function consoleFormat(
  result: ValidationResult,
  options?: LoggingOptions,
): string {
  const output: string[] = []
  const formatNested = (
    label: string,
    nested: Record<string, ValidationResult>,
    keyOrder: string[],
  ) => {
    for (const key of keyOrder) {
      const nestedResult = nested[key]
      if (!nestedResult) continue
      output.push(colors.blue(`${label}: ${key}`))

      if (nestedResult.issues.size === 0) {
        output.push(colors.green(`\tThis ${label.toLowerCase()} appears to be BIDS compatible.`))
      } else {
        ;(['warning', 'error'] as Severity[]).map((severity) => {
          output.push(...formatIssues(nestedResult.issues.filter({ severity }), options, severity))
        })
      }
      output.push(formatSummary(nestedResult.summary))
      output.push('')
    }
  }

  // Sources: sourcedata first, then rawbids; alphabetical within each group.
  if (result.sourcesSummary) {
    const sourceKeys = Object.keys(result.sourcesSummary).sort((a, b) => {
      const rank = (k: string) => k.startsWith('/sourcedata') ? 0 : k.startsWith('/rawbids') ? 1 : 2
      return rank(a) - rank(b) || a.localeCompare(b)
    })
    formatNested('Source', result.sourcesSummary, sourceKeys)
  }
  // Derivatives: alphabetical.
  if (result.derivativesSummary) {
    const derivKeys = Object.keys(result.derivativesSummary).sort()
    formatNested('Derivative', result.derivativesSummary, derivKeys)
  }

  // Root dataset section, last.
  output.push(colors.blue('Root dataset:'))
  if (result.issues.size === 0) {
    output.push(colors.green('\tThis dataset appears to be BIDS compatible.'))
  } else {
    ;(['warning', 'error'] as Severity[]).map((severity) => {
      output.push(...formatIssues(result.issues.filter({ severity }), options, severity))
    })
  }
  output.push('')
  output.push(formatSummary(result.summary))

  // Roll-up of nested-dataset issue counts, embedded in the root section.
  const rollup = formatNestedRollup(result)
  if (rollup) {
    output.push(rollup)
  }

  return output.join('\n')
}

/** Tally errors/warnings across nested datasets and render a brief table. */
function formatNestedRollup(result: ValidationResult): string {
  const tally = (nested: Record<string, ValidationResult> | undefined) => {
    if (!nested) return undefined
    let errors = 0
    let warnings = 0
    for (const r of Object.values(nested)) {
      errors += r.issues.get({ severity: 'error' }).length
      warnings += r.issues.get({ severity: 'warning' }).length
    }
    return { count: Object.keys(nested).length, errors, warnings }
  }
  const sources = tally(result.sourcesSummary)
  const derivs = tally(result.derivativesSummary)
  if (!sources && !derivs) return ''

  const rows: string[][] = []
  const row = (label: string, t: { count: number; errors: number; warnings: number }) => [
    colors.magenta(label),
    pluralize('dataset', t.count, true),
    pluralize('error', t.errors, true),
    pluralize('warning', t.warnings, true),
  ]
  if (sources) {
    rows.push(row('Sources:', sources))
  }
  if (derivs) {
    rows.push(row('Derivatives:', derivs))
  }
  return [
    '',
    colors.magenta('Nested datasets summary:'),
    new Table().body(rows).border(false).padding(2).indent(2).toString(),
    '',
  ].join('\n')
}

/**
 * Render marked tokens to ANSI strings
 */
// deno-lint-ignore no-explicit-any
function renderTokens(tokenList: any[]): string {
  if (!tokenList) return ''

  return tokenList.map((token) => {
    switch (token.type) {
      case 'paragraph':
        return renderTokens(token.tokens)

      case 'strong':
        return colors.bold(renderTokens(token.tokens))

      case 'em':
        return colors.italic(renderTokens(token.tokens))

      case 'codespan':
        return colors.cyan(token.text)

      case 'link':
        // Using the library to check for stdout support
        if (supportsHyperlinks.stdout) {
          return ansiEscapes.link(token.text, token.href)
        } else {
          // Fallback for terminals without support
          return `${colors.blue(token.text)} (${colors.gray(token.href)})`
        }

      case 'text':
        return token.text

      default:
        // Render children or return raw text
        return renderTokens(token.tokens || []) || token.raw || ''
    }
  }).join('')
}

function formatMessage(text: string): string {
  const cleanText = text.replaceAll(
    'SPEC_ROOT/',
    'https://bids-specification.readthedocs.io/en/stable/',
  )

  // Respect no-color flags or non-interactive environments
  if (colors.getColorEnabled() === false) {
    return cleanText
  }

  try {
    const tokens = marked.lexer(cleanText)
    return renderTokens(tokens)
  } catch {
    return cleanText
  }
}

function formatIssues(
  dsIssues: DatasetIssues,
  options?: LoggingOptions,
  severity = 'error',
): string[] {
  const output = []
  const color = severity === 'error' ? 'red' : 'yellow'

  for (const [code, issues] of dsIssues.groupBy('code').entries()) {
    if (issues.size === 0 || typeof code !== 'string') {
      continue
    }

    const codeMessage = formatMessage(issues.codeMessages.get(code) ?? '')
    output.push(
      '\t' +
        colors[color](
          `[${severity.toUpperCase()}] ${code} ${codeMessage}`,
        ),
    )

    const subCodes = issues.groupBy('subCode')
    if (subCodes.size === 1 && subCodes.has('None')) {
      output.push(...formatFiles(issues, options))
    } else {
      for (const [subCode, subIssues] of subCodes) {
        if (subIssues.size === 0) {
          continue
        }
        output.push('\t\t' + colors[color](`${subCode}`))
        output.push(...formatFiles(subIssues, options))
      }
    }

    output.push(
      colors.cyan(
        `\tPlease visit ${helpUrl(code)} for existing conversations about this issue.`,
      ),
    )
    output.push('')
  }
  return output
}

function formatFiles(issues: DatasetIssues, options?: LoggingOptions): string[] {
  const output = []
  let issueDetails: Array<keyof Issue> = ['location', 'issueMessage']
  if (options?.verbose) {
    issueDetails = ['location', 'issueMessage', 'rule']
  }

  const fileCount = options?.verbose ? undefined : 2

  const toPrint = issues.issues.slice(0, fileCount)
  toPrint.map((issue: Issue) => {
    const fileOut: string[] = []
    issueDetails.map((key) => {
      if (Object.hasOwn(issue, key) && issue[key]) {
        let content = `${issue[key]}`
        if (key === 'issueMessage') {
          content = formatMessage(content)
        }
        fileOut.push(content)
      }
    })
    output.push('\t\t' + fileOut.join(' - '))
  })
  if (fileCount && fileCount < issues.size) {
    output.push('')
    output.push(`\t\t${issues.size - fileCount} more files with the same issue`)
  }
  output.push('')
  return output
}

/**
 * Format for the summary
 */
function formatSummary(summary: SummaryOutput): string {
  const output = []
  const numSessions = summary.sessions.length > 0 ? summary.sessions.length : 1

  // data
  const column1 = [
      summary.totalFiles + ' ' + 'Files' + ', ' + prettyBytes(summary.size),
      summary.subjects.length +
      ' - ' +
      'Subjects ' +
      numSessions +
      ' - ' +
      'Sessions',
    ],
    column2 = summary.tasks,
    column3 = summary.modalities

  const longestColumn = Math.max(column1.length, column2.length, column3.length)
  const pad = '       '

  // headers
  const headers = [
    pad,
    colors.magenta('Summary:') + pad,
    colors.magenta('Available Tasks:') + pad,
    colors.magenta('Available Modalities:'),
  ]

  // rows
  const rows = []
  for (let i = 0; i < longestColumn; i++) {
    const val1 = column1[i] ? column1[i] + pad : ''
    const val2 = column2[i] ? column2[i] + pad : ''
    const val3 = column3[i] ? column3[i] : ''
    rows.push([pad, val1, val2, val3])
  }
  const table = new Table()
    .header(headers)
    .body(rows)
    .border(false)
    .padding(1)
    .indent(2)
    .toString()

  output.push(table)

  output.push('')

  return output.join('\n')
}

function helpUrl(code: string): string {
  // Provide a link to NeuroStars
  return `https://neurostars.org/search?q=${code}`
}

export function resultToJSONStr(result: ValidationResult, pretty: boolean = false): string {
  const indent = pretty ? 2 : 0
  return JSON.stringify(result, (_key, value) => {
    if (value?.parent) {
      // Remove parent reference to avoid circular references
      value.parent = undefined
    }
    if (value instanceof Map) {
      return Object.fromEntries(value)
    } else {
      return value
    }
  }, indent)
}

/*eslint no-console: ["error", {allow: ["log"]}] */

import validate from './index.js'

const format = validate.consoleFormat
import colors from 'colors/safe'
import fs from 'fs'
import remoteFiles from './utils/files/remoteFiles'

const exitProcess = issues => {
  if (
    issues === 'Invalid' ||
    (issues.errors && issues.errors.length >= 1) ||
    (issues.config && issues.config.length >= 1)
  ) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

const errorToString = err => {
  if (err instanceof Error) return err.stack
  else if (typeof err === 'object') return JSON.parse(err)
  else return err
}

export default function(dir, options) {
  process.on('unhandledRejection', err => {
    console.log(
      format.unexpectedError(
        // eslint-disable-next-line
        `Unhandled rejection (\n  reason: ${errorToString(err)}\n).\n`,
      ),
    )
    process.exit(3)
  })

  if (fs.existsSync(dir)) {
    if (options.json) {
      validate.BIDS(dir, options, function(issues, summary) {
        console.log(JSON.stringify({ issues, summary }))
        exitProcess(issues)
      })
    } else {
      validate.BIDS(dir, options, function(issues, summary) {
        console.log(format.issues(issues, options) + '\n')
        console.log(format.summary(summary, options))
        exitProcess(issues)
      })
    }
  } else {
    console.log(colors.red(dir + ' does not exist'))
    process.exit(2)
  }
}

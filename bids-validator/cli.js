/*eslint no-console: ["error", {allow: ["log"]}] */

import validate from './index.js';

const format = validate.consoleFormat
import colors from 'colors/safe';
import fs from 'fs';
import remoteFiles from './utils/files/remoteFiles';

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

export default function(dir, options) {
  process.on('unhandledRejection', err => {
    console.log(
      format.unexpectedError(
        // eslint-disable-next-line
        `Unhandled rejection (reason: ${JSON.stringify(err)}).`,
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
};

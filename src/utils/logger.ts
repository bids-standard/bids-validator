import { ConsoleHandler, getLogger, type LevelName, type Logger, setup } from '@std/log'

/**
 * Setup a console logger used with the --debug flag
 */
export function setupLogging(level: LevelName) {
  setup({
    handlers: {
      console: new ConsoleHandler(level),
    },

    loggers: {
      '@bids/validator': {
        level,
        handlers: ['console'],
      },
    },
  })
}

export function parseStack(stack: string): string | undefined {
  const lines = stack.split('\n')
  if (lines[0].trim() === 'Error') {
    // V8 stack trace format
    const caller = lines[2].trim()
    const token = caller.split('at ')
    return token[1]
  } else if (lines[0].match(/^\w+@/)) {
    // WebKit stack trace format
    const caller = lines[1].trim()
    const token = caller.split('@')
    return `${token[0]} (${token[1]})`
  }
}

const loggerProxyHandler = {
  // deno-lint-ignore no-explicit-any
  get: function (_: any, prop: keyof Logger) {
    const logger = getLogger('@bids/validator')
    const stack = new Error().stack
    if (stack) {
      const callerLocation = parseStack(stack) ?? '<unknown>'
      logger.debug(`Logger invoked at "${callerLocation}"`)
    }
    const logFunc = logger[prop] as typeof logger.warn
    return logFunc.bind(logger)
  },
}

const logger = new Proxy(getLogger('@bids/validator'), loggerProxyHandler)

export { logger }

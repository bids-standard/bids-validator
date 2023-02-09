import {
  setup,
  handlers,
  LevelName,
  getLogger,
  Logger,
} from '../deps/logger.ts'

/**
 * Setup a console logger used with the --debug flag
 */
export function setupLogging(level: LevelName) {
  setup({
    handlers: {
      console: new handlers.ConsoleHandler(level),
    },

    loggers: {
      '@bids/validator': {
        level,
        handlers: ['console'],
      },
    },
  })
}

const loggerProxyHandler = {
  get: function (_: void, prop: keyof Logger) {
    const logger = getLogger('@bids/validator')
    const stack = new Error().stack
    if (stack) {
      const callerLocation = stack.split('\n')[2].trim().split(' ')[1]
      logger.debug(`Logger invoked at "${callerLocation}"`)
    }
    const logFunc = logger[prop] as typeof logger.warning
    return logFunc.bind(logger)
  },
}

const logger = new Proxy(getLogger('@bids/validator'), loggerProxyHandler)

export { logger }

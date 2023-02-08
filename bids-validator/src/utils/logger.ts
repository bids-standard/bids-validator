import { setup, handlers, LevelName, getLogger } from '../deps/logger.ts'

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

const logger = getLogger('@bids/validator')

export { logger }

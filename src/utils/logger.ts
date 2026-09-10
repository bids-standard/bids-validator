import {
  ConsoleHandler,
  getLogger,
  type LevelName,
  type Logger,
  LogLevels,
  type LogRecord,
  setup,
} from '@std/log'

/**
 * Setup a console logger used with the --debug flag
 */
export function setupLogging(level: LevelName) {
  setup({
    handlers: {
      console: new ConsoleHandler(level, { formatter }),
    },

    loggers: {
      '@bids/validator': {
        level,
        handlers: ['console'],
      },
    },
  })
}

function inspect(value: object): string {
  return typeof Deno !== 'undefined'
    ? Deno.inspect(value, { depth: 1, compact: true, colors: false })
    : String(value)
}

export function describeError(err: unknown, depth = 3): string {
  if (depth < 0) return '...'
  // Normal JS errors, follow cause chain
  if (err instanceof Error) {
    // OS Errors have code
    const code = (err as { code?: string }).code
    const self = `${code ? `${err.name}[${code}]` : err.name}: ${err.message}`
    const cause = (err as { cause?: unknown }).cause
    return cause === undefined ? self : `${self}; caused by ${describeError(cause, depth - 1)}`
  }
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>
    // If validator issues are swallowed, provide detail
    if (typeof o.code === 'string') {
      const head = typeof o.subCode === 'string' ? `${o.code}/${o.subCode}` : o.code
      const detail: string[] = []
      if (typeof o.location === 'string') detail.push(`at ${o.location}`)
      if (typeof o.issueMessage === 'string') detail.push(o.issueMessage)
      if (o.message !== undefined) detail.push(`from ${describeError(o.message, depth - 1)}`)
      return detail.length ? `${head} (${detail.join('; ')})` : head
    }
    // Other objects
    return inspect(err)
  }
  return String(err)
}

export function formatter(record: LogRecord): string {
  const head = `${record.levelName} ${record.msg}`
  if (record.args.length === 0) return head
  return `${head}: ${record.args.map((arg) => describeError(arg)).join('; ')}`
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

/**
 * Test whether a DEBUG record emitted would reach at least one handler.
 */
export function debugEnabled(logger: Logger): boolean {
  return logger.level <= LogLevels.DEBUG &&
    logger.handlers.some((handler) => handler.level <= LogLevels.DEBUG)
}

const loggerProxyHandler: ProxyHandler<Logger> = {
  get: function (_: Logger, prop: keyof Logger) {
    const logger = getLogger('@bids/validator')
    if (debugEnabled(logger)) {
      const stack = new Error().stack
      if (stack) {
        const callerLocation = parseStack(stack) ?? '<unknown>'
        logger.debug(`Logger invoked at "${callerLocation}"`)
      }
    }
    const logFunc = logger[prop] as typeof logger.warn
    return logFunc.bind(logger)
  },
}

const logger = new Proxy(getLogger('@bids/validator'), loggerProxyHandler)

export { logger }

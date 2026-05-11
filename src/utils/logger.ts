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
  // V8's Error.stack format starts with an "Error" header line followed
  // by frames, so the original caller of the throwing site sits at
  // lines[2]. WebKit / JavaScriptCore (Safari, Tauri's WRY WebView, some
  // embedded JSC contexts) emits a header-less, `function@file:line`-
  // shaped stack that often has fewer than three frames; on those
  // engines `lines[2]` is undefined and `lines[2].trim()` throws
  // `TypeError: undefined is not an object`.
  //
  // Because `loggerProxyHandler.get` calls `parseStack` unconditionally
  // on every logger method access -- before the log level check --
  // this throw fires on the FIRST validator-internal logger touch in
  // any non-V8 runtime, regardless of `--debug` level. That makes it
  // impossible to run the validator under WebKit / JSC today.
  //
  // Fall back to lines[0] (and finally undefined) so non-V8 engines
  // get a slightly-less-detailed debug location instead of a fatal
  // throw. The caller's only consumer is a template-literal interpolation
  // (`Logger invoked at "${callerLocation}"`), which handles undefined
  // harmlessly.
  const lines = stack.split('\n')
  const caller = (lines[2] ?? lines[0])?.trim()
  if (!caller) return undefined
  const token = caller.split('at ')
  return token[1] ?? caller
}

const loggerProxyHandler = {
  // deno-lint-ignore no-explicit-any
  get: function (_: any, prop: keyof Logger) {
    const logger = getLogger('@bids/validator')
    const stack = new Error().stack
    if (stack) {
      const callerLocation = parseStack(stack)
      logger.debug(`Logger invoked at "${callerLocation}"`)
    }
    const logFunc = logger[prop] as typeof logger.warn
    return logFunc.bind(logger)
  },
}

const logger = new Proxy(getLogger('@bids/validator'), loggerProxyHandler)

export { logger }

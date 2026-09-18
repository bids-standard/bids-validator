import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert'
import { stripAnsiCode } from '@std/fmt/colors'
import {
  ConsoleHandler,
  getLogger,
  type LevelName,
  type LogLevel,
  LogLevels,
  setup,
} from '@std/log'
import { LogRecord } from '@std/log/logger'
import {
  debugEnabled,
  describeError,
  formatter,
  logger,
  parseStack,
  setupLogging,
} from './logger.ts'

Deno.test('logger', async (t) => {
  await t.step('test stack trace behavior for regular invocation', () => {
    const stack = `Error
    at Object.get (file:///bids-validator/src/utils/logger.ts:39:19)
    at file:///bids-validator/src/schema/context.ts:170:16
    at async BIDSContext.loadColumns (file:///bids-validator/src/schema/context.ts:163:20)
    at async Function.allSettled (<anonymous>)
    at async BIDSContext.asyncLoads (file:///bids-validator/src/schema/context.ts:182:5)
    at async validate (file:///bids-validator/src/validators/bids.ts:78:5)
    at async main (file:///bids-validator/src/main.ts:26:24)
    at async file:///bids-validator/bids-validator-deno:4:1
`
    assertEquals(
      parseStack(stack),
      `file:///bids-validator/src/schema/context.ts:170:16`,
    )
  })
  await t.step('test stack trace behavior for catch invocation', () => {
    const stack = `Error
    at Object.get (file:///bids-validator/bids-validator/src/utils/logger.ts:31:19)
    at loadHeader (file:///bids-validator/bids-validator/src/files/nifti.ts:18:12)
    at async BIDSContext.loadNiftiHeader (file:///bids-validator/bids-validator/src/schema/context.ts:155:27)
`
    assertEquals(
      parseStack(stack),
      'loadHeader (file:///bids-validator/bids-validator/src/files/nifti.ts:18:12)',
    )
  })
  await t.step('test stack trace behavior for webkit format', () => {
    const stack = `get@file:///bids-validator/src/utils/logger.ts:30:32
validate@file:///bids-validator/src/validators/bids.ts:110:18
`
    assertEquals(
      parseStack(stack),
      'validate (file:///bids-validator/src/validators/bids.ts:110:18)',
    )
  })
  await t.step('test stack trace behavior for unknown format', () => {
    // Just making this one up to be plausible but not real
    const stack = `get() (defined at file:///bids-validator/src/utils/logger.ts:30:32)
called from validate() (defined at file:///bids-validator/src/validators/bids.ts:110:18)
`
    assertEquals(parseStack(stack), undefined)
  })
  await t.step('Does not throw on empty stack', () => {
    assertEquals(parseStack(''), undefined)
  })
})

Deno.test('DEBUG log level detection', async (t) => {
  setup({
    handlers: {
      errorhandler: new ConsoleHandler('ERROR'),
      debughandler: new ConsoleHandler('DEBUG'),
    },
    loggers: {
      // No handler, not enabled
      testLoggerA: { level: 'DEBUG', handlers: [] },
      // Top level ERROR, not enabled
      testLoggerB: { level: 'ERROR', handlers: ['debughandler'] },
      // No handler at DEBUG, not enabled
      testLoggerC: { level: 'DEBUG', handlers: ['errorhandler'] },
      // Top level DEBUG, has handler at DEBUG, enabled
      testLoggerD: { level: 'DEBUG', handlers: ['debughandler'] },
    },
  })
  await t.step('debugEnabled returns false for logger with no handlers', () => {
    assertEquals(debugEnabled(getLogger('testLoggerA')), false)
  })
  await t.step('debugEnabled returns false for logger at ERROR level', () => {
    assertEquals(debugEnabled(getLogger('testLoggerB')), false)
  })
  await t.step('debugEnabled returns false for logger with handlers above DEBUG', () => {
    assertEquals(debugEnabled(getLogger('testLoggerC')), false)
  })
  await t.step('debugEnabled returns true for logger+handlers at DEBUG', () => {
    assertEquals(debugEnabled(getLogger('testLoggerD')), true)
  })
})

/**
 * Configure logging at `level`, then capture everything the console handler
 * writes while `emit` runs.
 */
function captureLogOutput(level: LevelName, emit: () => void): string[] {
  setupLogging(level)
  const lines: string[] = []
  const original = console.log
  console.log = (...args: unknown[]) => {
    lines.push(stripAnsiCode(String(args[0])))
  }
  try {
    emit()
  } finally {
    console.log = original
  }
  return lines
}

/**
 * This is a regression test without a regression issue.
 * An attempt at reducing calls to `getLogger()` by calling once at module scope
 * resulted in all log actions occurring in the pre-configuration state.
 * These tests ensure that our logger proxy always emits at the current state.
 */
Deno.test('log records reach a handler', async (t) => {
  await t.step('debug records are emitted when configured at DEBUG', () => {
    const lines = captureLogOutput('DEBUG', () => logger.debug('a debug record'))
    assertFalse(lines.length === 0, 'no output reached the console handler')
    assertStringIncludes(lines.join('\n'), 'DEBUG a debug record')
  })

  await t.step('caller location accompanies a debug record', () => {
    const lines = captureLogOutput('DEBUG', () => logger.debug('a debug record'))
    assertEquals(lines.length, 2)
    assertStringIncludes(lines[0], 'Logger invoked at')
    assertStringIncludes(lines[0], 'logger.test.ts')
  })

  await t.step('warnings are emitted when configured at WARN', () => {
    const lines = captureLogOutput('WARN', () => logger.warn('a warning'))
    assertEquals(lines, ['WARN a warning'])
  })

  await t.step('errors are emitted, and lower levels filtered, at ERROR', () => {
    const lines = captureLogOutput('ERROR', () => {
      logger.debug('suppressed')
      logger.info('suppressed')
      logger.warn('suppressed')
      logger.error('an error')
    })
    // Nothing below ERROR is emitted, and the caller-location line is gated off.
    assertEquals(lines, ['ERROR an error'])
  })

  await t.step('every level reaches a handler when configured at DEBUG', () => {
    for (const level of ['debug', 'info', 'warn', 'error', 'critical'] as const) {
      const lines = captureLogOutput('DEBUG', () => logger[level](`${level} record`))
      assertStringIncludes(lines.join('\n'), `${level} record`, `${level} did not reach a handler`)
    }
  })

  // Leave the shared @std/log state quiet for any test file that runs later.
  setup({ handlers: {}, loggers: { '@bids/validator': { level: 'NOTSET', handlers: [] } } })
})

Deno.test('describeError', async (t) => {
  await t.step('an Error renders as name and message', () => {
    assertEquals(describeError(new Error('plain failure')), 'Error: plain failure')
    assertEquals(describeError(new TypeError('bad type')), 'TypeError: bad type')
  })

  await t.step('an OS error carries its code alongside the name', () => {
    const osErr = Object.assign(new Error('No such file'), { name: 'NotFound', code: 'ENOENT' })
    assertEquals(describeError(osErr), 'NotFound[ENOENT]: No such file')
  })

  await t.step('a cause chain is followed', () => {
    assertEquals(
      describeError(new Error('outer', { cause: new RangeError('inner') })),
      'Error: outer; caused by RangeError: inner',
    )
  })

  await t.step('a cause of any type is described in turn', () => {
    // The cause crosses back into the object and primitive branches.
    assertEquals(
      describeError(new Error('outer', { cause: { code: 'JSON_INVALID' } })),
      'Error: outer; caused by JSON_INVALID',
    )
    assertEquals(
      describeError(new Error('outer', { cause: 'a string cause' })),
      'Error: outer; caused by a string cause',
    )
  })

  await t.step('an Issue object renders code, subCode, location and message', () => {
    assertEquals(describeError({ code: 'JSON_INVALID' }), 'JSON_INVALID')
    assertEquals(describeError({ code: 'FILE_READ', subCode: 'NotFound' }), 'FILE_READ/NotFound')
    assertEquals(
      describeError({ code: 'INVALID_GZIP', location: '/x.nii.gz' }),
      'INVALID_GZIP (at /x.nii.gz)',
    )
    assertEquals(
      describeError({ code: 'TSV_DUP', issueMessage: 'onset, onset' }),
      'TSV_DUP (onset, onset)',
    )
    assertEquals(
      describeError({
        code: 'FILE_READ',
        subCode: 'NotFound',
        location: '/a.nii.gz',
        issueMessage: 'dangling',
      }),
      'FILE_READ/NotFound (at /a.nii.gz; dangling)',
    )
  })

  await t.step('an Issue nesting an exception under `message` recurses', () => {
    // The shape thrown by files/streams.ts on a decode failure.
    assertEquals(
      describeError({ code: 'INVALID_FILE_ENCODING', message: new TypeError('bad') }),
      'INVALID_FILE_ENCODING (from TypeError: bad)',
    )
  })

  await t.step('non-string Issue fields are skipped', () => {
    // `location` is not a string, so no detail accumulates and the bare code is returned.
    assertEquals(describeError({ code: 'X', location: 42 }), 'X')
  })

  await t.step('an object without a code is inspected', () => {
    assertEquals(describeError({ unexpected: true, n: 3 }), '{ unexpected: true, n: 3 }')
    assertEquals(describeError([1, 2, 3]), '[ 1, 2, 3 ]')
  })

  await t.step('inspection degrades without Deno, as in the web bundle', () => {
    const saved = globalThis.Deno
    try {
      // deno-lint-ignore no-explicit-any
      delete (globalThis as any).Deno
      assertEquals(describeError({ unexpected: true }), '[object Object]')
    } finally {
      // deno-lint-ignore no-explicit-any
      ;(globalThis as any).Deno = saved
    }
  })

  await t.step('non-objects are stringified', () => {
    assertEquals(describeError('raw string'), 'raw string')
    assertEquals(describeError(undefined), 'undefined')
    assertEquals(describeError(null), 'null')
    assertEquals(describeError(42), '42')
    assertEquals(describeError(false), 'false')
  })

  await t.step('recursion is bounded to four levels by default', () => {
    let err = new Error('L5')
    for (let i = 4; i >= 0; i--) err = new Error(`L${i}`, { cause: err })
    assertEquals(
      describeError(err),
      'Error: L0; caused by Error: L1; caused by Error: L2; caused by Error: L3; caused by ...',
    )
  })

  await t.step('an exhausted depth budget short-circuits', () => {
    assertEquals(describeError(new Error('x'), -1), '...')
    assertEquals(
      describeError(new Error('a', { cause: new Error('b') }), 0),
      'Error: a; caused by ...',
    )
  })

  await t.step('nested `message` recursion is bounded too', () => {
    let deep: Record<string, unknown> = { code: 'L5' }
    for (let i = 4; i >= 0; i--) deep = { code: `L${i}`, message: deep }
    assertEquals(describeError(deep), 'L0 (from L1 (from L2 (from L3 (from ...))))')
  })

  await t.step('a self-referential `message` terminates', () => {
    const cycle: Record<string, unknown> = { code: 'A' }
    cycle.message = cycle
    assertEquals(describeError(cycle), 'A (from A (from A (from A (from ...))))')
  })

  await t.step('an Issue whose `message` is an Error keeps that cause chain', () => {
    assertEquals(
      describeError({ code: 'TOP', message: new Error('e1', { cause: new Error('e2') }) }),
      'TOP (from Error: e1; caused by Error: e2)',
    )
  })

  await t.step('a self-referential cause terminates', () => {
    const cycle = new Error('loop') as Error & { cause?: unknown }
    cycle.cause = cycle
    assertEquals(
      describeError(cycle),
      'Error: loop; caused by Error: loop; caused by Error: loop; caused by Error: loop; caused by ...',
    )
  })
})

Deno.test('formatter', async (t) => {
  const record = (msg: string, args: unknown[], level: LogLevel = LogLevels.DEBUG) =>
    new LogRecord({ msg, args, level, loggerName: '@bids/validator' })

  await t.step('a record without args renders the message alone', () => {
    assertEquals(
      formatter(record('Performing file-level validation...', [])),
      'DEBUG Performing file-level validation...',
    )
  })

  await t.step('a single arg is described and appended', () => {
    assertEquals(
      formatter(record('Error parsing gzip header', [{
        code: 'INVALID_GZIP',
        location: '/x.nii.gz',
      }])),
      'DEBUG Error parsing gzip header: INVALID_GZIP (at /x.nii.gz)',
    )
    assertEquals(
      formatter(record('Failed to fetch schema', [new TypeError('connection reset')])),
      'DEBUG Failed to fetch schema: TypeError: connection reset',
    )
  })

  await t.step('multiple args are joined', () => {
    assertEquals(
      formatter(record('Fallback taken', [{ code: 'A' }, 'extra note'])),
      'DEBUG Fallback taken: A; extra note',
    )
    assertEquals(
      formatter(record('Fallback taken', [{ code: 'A' }, { code: 'B' }, 7])),
      'DEBUG Fallback taken: A; B; 7',
    )
  })

  await t.step('the level name prefixes the line', () => {
    assertEquals(
      formatter(record('a warning', [{ code: 'Z' }], LogLevels.WARN)),
      'WARN a warning: Z',
    )
  })
})

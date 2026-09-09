import { assertEquals } from '@std/assert'
import { ConsoleHandler, getLogger, setup } from '@std/log'
import { debugEnabled, parseStack } from './logger.ts'

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

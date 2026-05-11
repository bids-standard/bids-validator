import { assertEquals } from '@std/assert'
import { parseStack } from './logger.ts'

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
  await t.step('does not throw on WebKit-shaped Error.stack', () => {
    // WebKit / JavaScriptCore (Safari, Tauri's WRY WebView, embedded JSC)
    // emits a header-less, `function@file:line`-shaped stack that often
    // has fewer than three frames. The original `lines[2].trim()` threw
    // `TypeError: undefined is not an object` on the FIRST validator-
    // internal logger access, regardless of log level, breaking
    // validator use under any non-V8 runtime.
    const webkitTwoFrame =
      'get@file:///bids-validator/src/utils/logger.ts:30:32\nvalidate@file:///bids-validator/src/validators/bids.ts:110:18\n'
    // Must not throw, and must return a defined-or-undefined value (the
    // caller -- a template-literal interpolation -- handles both).
    const result = parseStack(webkitTwoFrame)
    if (result !== undefined && typeof result !== 'string') {
      throw new Error(`parseStack returned non-string non-undefined: ${result}`)
    }
  })
  await t.step('does not throw on an empty stack', () => {
    // Defensive: some runtimes (e.g. when Error.stack is disabled or
    // captureStackTrace returns "") emit empty strings.
    const result = parseStack('')
    if (result !== undefined && typeof result !== 'string') {
      throw new Error(`parseStack returned non-string non-undefined: ${result}`)
    }
  })
})

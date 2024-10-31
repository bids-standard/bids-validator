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
})

import { main } from './main.ts'
import { detectErrors } from './summary/summary.ts'

const result = await main()

if (detectErrors(result)) {
  Deno.exit(16)
}
Deno.exit(0)

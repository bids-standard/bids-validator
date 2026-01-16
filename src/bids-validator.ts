import { main } from './main.ts'
import { checkAllErrors } from './summary/summary.ts'

const result = await main()
const errors = checkAllErrors(result)

if (errors.length) {
  Deno.exit(16)
}
Deno.exit(0)

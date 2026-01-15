import { main } from './main.ts'
import { checkAllErrors } from './summary/summary.ts'

const result = await main()
// write result to formated json file in current working directory named result_dataset_folder.json
console.log(result.summary)
const errors = checkAllErrors(result)

if (errors.length) {
  Deno.exit(16)
}
Deno.exit(0)

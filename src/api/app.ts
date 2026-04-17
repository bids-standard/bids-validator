/**
 * The command-line interface for the BIDS Validator.
 *
 * @example
 * ```bash
 * deno -A jsr:@bids/validator [OPTIONS] /path/to/dataset
 * ```
 */
import { main } from '@bids/validator/main'
import { detectErrors } from '@bids/validator/validate'

const result = await main()

if (detectErrors(result)) {
  Deno.exit(16)
}
Deno.exit(0)

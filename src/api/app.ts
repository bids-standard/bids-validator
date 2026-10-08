/**
 * # BIDS Validator
 *
 * The command-line interface for the BIDS Validator.
 *
 * Importing this module runs the BIDS validator using Deno APIs.
 *
 * ## Library API
 *
 * For programmatic use, import from the subpath modules:
 *
 * | Module                  | Purpose                                       |
 * | ----------------------- | --------------------------------------------- |
 * | {@link [validate]}      | Run validation and inspect results            |
 * | {@link [files]}         | Tools for building and typing file accessors  |
 * | {@link [files/browser]} | Access files using the browser File API       |
 * | {@link [files/deno]}    | Access filesystem files using Deno            |
 * | {@link [files/git]}     | Access files in git/git-annex repositories    |
 * | {@link [filetree]}      | Build and manipulate file trees               |
 * | {@link [issues]}        | Issue types and the `DatasetIssues` container |
 * | {@link [output]}        | Result formatting for CLIs and UIs            |
 * | {@link [cli]}           | Extensible Cliffy command (`validateCommand`) |
 *
 * @example Command-line usage
 * ```bash
 * deno -A jsr:@bids/validator [OPTIONS] /path/to/dataset
 * ```
 *
 * @module
 */
import { main } from '../main.ts'
import { detectErrors } from '../summary/summary.ts'

const result = await main()

if (detectErrors(result)) {
  Deno.exit(16)
}
Deno.exit(0)

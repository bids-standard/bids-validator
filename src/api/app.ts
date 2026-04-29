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
 * | Module                                      | Purpose                                       |
 * | ------------------------------------------- | --------------------------------------------- |
 * | [/validate]{@linkcode ./validate}           | Run validation and inspect results            |
 * | [/files]{@linkcode ./files}                 | Tools for building and typing file accessors  |
 * | [/files/browser]{@linkcode ./files/browser} | Access files using the browser File API       |
 * | [/files/deno]{@linkcode ./files/deno}       | Access filesystem files using Deno            |
 * | [/files/git]{@linkcode ./files/git}         | Access files in git/git-annex repositories    |
 * | [/filetree]{@linkcode ./filetree}           | Build and manipulate file trees               |
 * | [/issues]{@linkcode ./issues}               | Issue types and the `DatasetIssues` container |
 * | [/output]{@linkcode ./output}               | Result formatting for CLIs and UIs            |
 * | [/cli]{@linkcode ./cli}                     | Extensible Cliffy command (`validateCommand`) |
 *
 * @example Command-line usage
 * ```bash
 * deno -A jsr:@bids/validator [OPTIONS] /path/to/dataset
 * ```
 *
 * @module
 */
import { main } from '@bids/validator/main'
import { detectErrors } from '@bids/validator/validate'

const result = await main()

if (detectErrors(result)) {
  Deno.exit(16)
}
Deno.exit(0)

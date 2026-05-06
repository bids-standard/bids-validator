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
 * | Module                              | Purpose                                       |
 * | ----------------------------------- | --------------------------------------------- |
 * | [/validate](doc/validate)           | Run validation and inspect results            |
 * | [/files](doc/files)                 | Tools for building and typing file accessors  |
 * | [/files/browser](doc/files/browser) | Access files using the browser File API       |
 * | [/files/deno](doc/files/deno)       | Access filesystem files using Deno            |
 * | [/files/git](doc/files/git)         | Access files in git/git-annex repositories    |
 * | [/filetree](doc/filetree)           | Build and manipulate file trees               |
 * | [/issues](doc/issues)               | Issue types and the `DatasetIssues` container |
 * | [/output](doc/output)               | Result formatting for CLIs and UIs            |
 * | [/cli](doc/cli)                     | Extensible Cliffy command (`validateCommand`) |
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

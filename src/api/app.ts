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
 * | Module                          | Purpose                                       |
 * | ------------------------------- | --------------------------------------------- |
 * | [/validate](validate)           | Run validation and inspect results            |
 * | [/files](files)                 | Tools for building and typing file accessors  |
 * | [/files/browser](files/browser) | Access files using the browser File API       |
 * | [/files/deno](files/deno)       | Access filesystem files using Deno            |
 * | [/files/git](files/git)         | Access files in git/git-annex repositories    |
 * | [/filetree](filetree)           | Build and manipulate file trees               |
 * | [/issues](issues)               | Issue types and the `DatasetIssues` container |
 * | [/output](output)               | Result formatting for CLIs and UIs            |
 * | [/cli](cli)                     | Extensible Cliffy command (`validateCommand`) |
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

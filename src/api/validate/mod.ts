/**
 * Run BIDS validation and inspect results.
 *
 * {@link validate} is the entry point. Build a {@link [filetree].FileTree}
 * from one of the source-specific modules ({@link [files/deno]},
 * {@link [files/browser]}, {@link [files/git]}) and pass it in along with
 * a {@link ValidatorOptions} object. The returned
 * {@link ValidationResult} can be checked with {@link detectErrors} and
 * formatted via {@link [output].consoleFormat} or
 * {@link [output].resultToJSONStr}.
 *
 * @module
 */

export { validate } from '../../validators/bids.ts'
export { detectErrors } from '../../summary/summary.ts'
export { getVersion } from '../../version.ts'
export type {
  SubjectMetadata,
  SummaryOutput,
  ValidationResult,
} from '../../types/validation-result.ts'
export type { Config, ValidatorOptions } from '../../setup/options.ts'

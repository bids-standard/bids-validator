/**
 * @deprecated The ./options entry point is deprecated. Use:
 * - Config, ValidatorOptions → '@bids/validator/validate'
 * - validateCommand → '@bids/validator/cli'
 * parseOptions has no replacement and will be removed in v4.
 */

/** @deprecated Use Config from '@bids/validator/validate'. */
export type { Config } from '../../setup/options.ts'
/** @deprecated Use ValidatorOptions from '@bids/validator/validate'. */
export type { ValidatorOptions } from '../../setup/options.ts'
/** @deprecated Use validateCommand from '@bids/validator/cli'. */
export { validateCommand } from '../../setup/options.ts'
/** @deprecated parseOptions will be removed in v4. No replacement — use validate() with your own options. */
export { parseOptions } from '../../setup/options.ts'

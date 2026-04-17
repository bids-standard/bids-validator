/**
 * @deprecated The ./main entry point is deprecated. Use the specific
 * subpath imports instead:
 * - validate, getVersion, ValidationResult → '@bids/validator/validate'
 * - fileListToTree → '@bids/validator/files/browser'
 */

/** @deprecated Use validate from '@bids/validator/validate'. */
export { validate } from '../../validators/bids.ts'
/** @deprecated Use getVersion from '@bids/validator/validate'. */
export { getVersion } from '../../version.ts'
/** @deprecated Use ValidationResult from '@bids/validator/validate'. */
export type { ValidationResult } from '../../types/validation-result.ts'
/** @deprecated Use fileListToTree from '@bids/validator/files/browser'. */
export { fileListToTree } from '../../files/browser.ts'
/** @deprecated Use validate() and friends from '@bids/validator/validate' instead. main() will be removed in v4. */
export { main } from '../../main.ts'

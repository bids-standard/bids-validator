/**
 * @deprecated The `./options` entry point is retained for v3 back-compat
 * and will be removed in v4. Migrate to:
 * - {@link [validate].Config}, {@link [validate].ValidatorOptions}
 * - {@link [cli].validateCommand}
 *
 * `parseOptions` has no replacement — call {@link [validate].validate}
 * with your own {@link [validate].ValidatorOptions} object instead of
 * relying on `Deno.args` parsing.
 *
 * @module
 */

import {
  parseOptions as _parseOptions,
  validateCommand as _validateCommand,
} from '../../setup/options.ts'
import type {
  Config as _Config,
  ValidatorOptions as _ValidatorOptions,
} from '../../setup/options.ts'

/** @deprecated Use {@link [validate].Config} instead. */
export type Config = _Config

/** @deprecated Use {@link [validate].ValidatorOptions} instead. */
export type ValidatorOptions = _ValidatorOptions

/** @deprecated Use {@link [cli].validateCommand} instead. */
export const validateCommand = _validateCommand

/**
 * @deprecated `parseOptions` will be removed in v4. No drop-in
 * replacement — call {@link [validate].validate} with a
 * {@link [validate].ValidatorOptions} object you construct yourself.
 */
export const parseOptions = _parseOptions

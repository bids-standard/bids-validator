/**
 * @deprecated The `./main` entry point is retained for v3 back-compat
 * and will be removed in v4. Migrate to the subpath modules:
 * - {@link [validate].validate}, {@link [validate].getVersion},
 *   {@link [validate].ValidationResult}
 * - {@link [files/browser].fileListToTree}
 *
 * `main()` itself has no replacement — compose
 * {@link [validate].validate}, the file-tree helpers, and
 * {@link [output].consoleFormat} / {@link [output].resultToJSONStr}.
 *
 * @module
 */

import { validate as _validate } from '../../validators/bids.ts'
import { getVersion as _getVersion } from '../../version.ts'
import { fileListToTree as _fileListToTree } from '../../files/browser.ts'
import { main as _main } from '../../main.ts'
import type { ValidationResult as _ValidationResult } from '../../types/validation-result.ts'

/** @deprecated Use {@link [validate].validate} instead. */
export const validate = _validate

/** @deprecated Use {@link [validate].getVersion} instead. */
export const getVersion = _getVersion

/** @deprecated Use {@link [files/browser].fileListToTree} instead. */
export const fileListToTree = _fileListToTree

/**
 * @deprecated `main()` will be removed in v4. No drop-in replacement —
 * compose {@link [validate].validate} with file-tree helpers from
 * {@link [files/deno]} / {@link [files/browser]} / {@link [files/git]}
 * and format results with {@link [output].consoleFormat} or
 * {@link [output].resultToJSONStr}.
 */
export const main = _main

/** @deprecated Use {@link [validate].ValidationResult} instead. */
export type ValidationResult = _ValidationResult

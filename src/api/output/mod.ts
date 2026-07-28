/**
 * Result formatting for CLIs and UIs.
 *
 * {@link consoleFormat} produces a human-readable, optionally coloured
 * report from a {@link [validate].ValidationResult}.
 * {@link resultToJSONStr} produces a JSON serialisation suitable for
 * machine consumption.
 *
 * @module
 */

export { consoleFormat, resultToJSONStr } from '../../utils/output.ts'

/**
 * Extensible Cliffy command — extension contract for embedders.
 *
 * {@link validateCommand} is the {@link https://cliffy.io/ Cliffy}
 * `Command` instance backing the `bids-validator` CLI. Embedders that
 * want to extend the CLI (add subcommands, override flag handling, or
 * wrap the standard run loop) should clone or extend this command;
 * library consumers should call {@link [validate].validate} directly
 * with their own {@link [validate].ValidatorOptions} instead of going
 * through CLI plumbing.
 *
 * @module
 */

export { validateCommand } from '../../setup/options.ts'

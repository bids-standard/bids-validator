/**
 * Issue
 *
 * A constructor for BIDS issues.
 */
module.exports = function (options) {
	this.filename  = options.hasOwnProperty('file')      ? options.file.name         : null;
	this.path      = options.hasOwnProperty('path')      ? options.file.relativePath : null;
	this.evidence  = options.hasOwnProperty('evidence')  ? options.evidence          : null;
    this.line      = options.hasOwnProperty('line')      ? options.line              : null;
    this.character = options.hasOwnProperty('character') ? options.character         : null;
    this.severity  = options.hasOwnProperty('severity')  ? options.severity          : 'error';
    this.reason    = options.hasOwnProperty('reason')    ? options.reason            : null;
};
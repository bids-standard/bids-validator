var issues = require('./issues');

/**
 * Issue
 *
 * A constructor for BIDS issues.
 */
module.exports = function (options) {
	var code = options.hasOwnProperty('code') ? options.code : null;
	var issue = issues[code];

	this.code      = code;
	this.filename  = options.hasOwnProperty('file')      ? options.file.name : null;
	this.path      = options.hasOwnProperty('path')      ? options.path      : options.file.relativePath;
	this.evidence  = options.hasOwnProperty('evidence')  ? options.evidence  : null;
    this.line      = options.hasOwnProperty('line')      ? options.line      : null;
    this.character = options.hasOwnProperty('character') ? options.character : null;
    this.severity  = options.hasOwnProperty('severity')  ? options.severity  : issue.severity;
    this.reason    = options.hasOwnProperty('reason')    ? options.reason    : issue.reason;
};
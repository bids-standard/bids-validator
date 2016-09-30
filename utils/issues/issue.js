var issues = require('./list');

/**
 * Issue
 *
 * A constructor for BIDS issues.
 */
module.exports = function (options) {
	var code = options.hasOwnProperty('code') ? options.code : null;
	var issue = issues[code];

	this.code      = code;
	this.file      = options.hasOwnProperty('file')      ? options.file      : null;
	this.evidence  = options.hasOwnProperty('evidence')  ? options.evidence  : null;
    this.line      = options.hasOwnProperty('line')      ? options.line      : null;
    this.character = options.hasOwnProperty('character') ? options.character : null;
    this.severity  = options.hasOwnProperty('severity')  ? options.severity  : issue.severity;
    this.reason    = options.hasOwnProperty('reason')    ? options.reason    : issue.reason;
};
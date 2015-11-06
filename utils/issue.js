/**
 * Issue
 *
 * A constructor for BIDS issues.
 */
module.exports = function (options) {
	var code = options.hasOwnProperty('code') ? options.code : null;
	var issue = issues[code];

	this.filename  = options.hasOwnProperty('file')      ? options.file.name         : null;
	this.path      = options.hasOwnProperty('path')      ? options.file.relativePath : null;
	this.evidence  = options.hasOwnProperty('evidence')  ? options.evidence          : null;
    this.line      = options.hasOwnProperty('line')      ? options.line              : null;
    this.character = options.hasOwnProperty('character') ? options.character         : null;
    this.severity  = options.hasOwnProperty('severity')  ? options.severity          : issue.severity;
    this.reason    = options.hasOwnProperty('reason')    ? options.reason            : issue.reason;
};

var issues = {
	1: {
		severity: 'warning',
		reason: "This file is not part of the BIDS specification, make sure it isn't included in the dataset by accident. Data derivatives (processed data) should be placed in /derivatives folder."
	},
	2: {
        severity: 'warning',
        reason: "'RepetitionTime' is greater than 100 are you sure it's expressed in seconds?"
	},
	3: {
        severity: 'warning',
        reason: "'EchoTime' is greater than 1 are you sure it's expressed in seconds?"
	},
	4: {
        severity: 'warning',
        reason: "'EchoTimeDifference' is greater than 1 are you sure it's expressed in seconds?"
	},
	5: {
        severity: 'warning',
        reason: "'TotalReadoutTime' is greater than 10 are you sure it's expressed in seconds?"
	},
	6: {
        severity: 'warning',
		reason:   "You should should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible."
	},
	7: {
		severity: 'warning',
		reason:   "You should should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible."
	},
	8: {
		severity: 'warning',
		reason:   "You should should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible."
	},
	9: {
		severity: 'warning',
		reason:   "You should should define 'TotalReadoutTime' for this file. If you don't provide this information field map correction using TOPUP might not be possible."
	},
	10: {
		severity: 'error',
		reason:   "You have to define 'RepetitionTime' for this file."
	},
	11: {
		severity: 'error',
		reason:   "Repetition time was not defined in seconds, milliseconds or microseconds in the scan's header."
	},
	12: {
		severity: 'error',
		reason:   "Repetition time did not match between the scan's header and the associated JSON metadata file."
	},
	13: {
		severity: 'warning',
		reason:   "You should should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible."
	},
	14: {
		severity: 'warning',
		reason:   "You should should define 'SliceEncodingDirection' for this file. If you don't provide this information slice time correction will not be possible."
	},
	15: {
		severity: 'error',
		reason:   "You have to define 'EchoTimeDifference' for this file."
	},
	16: {
		severity: 'error',
		reason:   "You have to define 'EchoTime' for this file."
	},
	17: {
		severity: 'error',
		reason:   "You have to define 'Units' for this file."
	},
	18: {
		severity: 'error',
		reason:   "You have to define 'PhaseEncodingDirection' for this file."
	},
	19: {
		severity: 'error',
		reason:   "You have to define 'TotalReadoutTime' for this file."
	},
	20: {
		severity: 'error',
		reason:   "First column of the events file must be named 'onset'"
	},
	21: {
		severity: 'error',
		reason:   "Second column of the events file must be named 'duration'"
	},
	22: {
		severity: 'error',
		reason:   'All rows must have the same number of columns as there are headers.'
	},
	23: {
		severity: 'error',
		reason:   'Values may not contain adjacent spaces.'
	},
	24: {
		severity: 'warning',
		reason:   'A proper way of labeling missing values is "n/a".'
	},
	25: {
		severity: 'warning',
		reason:   'Task scans should have a correspondings events.tsv file.'
	},
	26: {
		severity: 'error',
		reason:   "We were unable to read the contents of this file."
	},
}
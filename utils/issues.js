/**
 * Issues
 *
 * A list of all possible issues organized by
 * issue code and including severity and reason
 * agnostic to file specifics.
 */
module.exports = {
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
		reason:   "You should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible."
	},
	7: {
		severity: 'warning',
		reason:   "You should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible."
	},
	8: {
		severity: 'warning',
		reason:   "You should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible."
	},
	9: {
		severity: 'warning',
		reason:   "You should define 'TotalReadoutTime' for this file. If you don't provide this information field map correction using TOPUP might not be possible."
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
		reason:   "You should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible."
	},
	15: {
		severity: 'error',
		reason:   "You have to define 'EchoTime1' and/or 'EchoTime2' for this file."
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
		reason:   'Empty cell in TSV file detected: The proper way of labeling missing values is "n/a".'
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
		reason:   "We were unable to parse header data from this NIfTI file. Please ensure it is not corrupted or mislabeled."
	},
	27: {
		severity: 'error',
		reason: "Not a valid JSON file."
	},
	28: {
		severity: 'error',
		reason: "This file ends in the .gz extension but is not actually gzipped."
	},
	29: {
		severity: 'error',
		reason: "The number of volumes in this scan does not match the number of volumes in the corresponding .bvec and .bval files."
	},
	30: {
		severity: 'error',
		reason: ".bval files should contain exactly one row of volumes."
	},
	31: {
		severity: 'error',
		reason: ".bvec files should contain exactly three rows of volumes."
	},
	32: {
		severity: 'error',
		reason: "DWI scans should have a corresponding .bvec file."
	},
	33: {
		severity: 'error',
		reason: "DWI scans should have a corresponding .bval file."
	},
	34: {
		severity: 'error',
		reason: "'PhaseEncodingDirection' needs to be one of 'i', 'i-, 'j', 'j-', 'k', or k-'"
	},
	36: {
		severity: 'error',
		reason: "This file is too small to contain the minimal NIfTI header."
	},
	35: {
		severity: 'error',
		reason: "'SliceEncodingDirection' needs to be one of 'i', 'i-, 'j', 'j-', 'k', or k-'"
	},
	37: {
		severity: 'error',
		reason: "'IntendedFor' field needs to point to an existing file."
	},
    38: {
        severity: 'warning',
        reason: "Subject session may be missing file"
    } 

};

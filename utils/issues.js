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
        reason:   "You have to define 'EchoTime1' and 'EchoTime2' for this file."
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
        reason:   'Task scans should have a corresponding events.tsv file. If this is a resting state scan you can ignore this warning or rename the task to include the word "rest".'
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
        reason: "Not all subjects contain the same files. Each subject should contain the same number of files with " +
        "the same naming unless some files are known to be missing."
    },
    39: {
        severity: 'warning',
        reason: "Not all subjects/sessions/runs have the same scanning parameters."
    },
    40: {
        severity: 'warning',
        reason: "Nifti file's header field for dimension information blank or too short."
    },
    41: {
        severity: 'warning',
        reason: "Nifti file's header field for unit information for x, y, z, and t dimensions empty or too short"
    },
    42: {
        severity: 'warning',
        reason: "Nifti file's header field for pixel dimension information empty or too short."
    },
    43: {
        severity: 'error',
        reason: "This file appears to be an orphaned symlink. Make sure it correctly points to its referent."
    },
    44: {
        severity: 'error',
        reason: "We were unable to read this file. Make sure it is not corrupted, incorectly named or incorectly symlinked."
    },
    45: {
        severity: 'error',
        reason: "There are no subject folders (labeled \"sub-*\") in the root of this dataset."
    },
    46: {
        severity: 'error',
        reason: "Each row in a .bvec file should contain the same number of values."
    },
    47: {
        severity: 'error',
        reason: ".bval and .bvec files must be single space delimited and contain only numerical values."
    },
    48: {
        severity: 'error',
        reason:   "Participants and phenotype .tsv files must have a 'participant_id' column."
    },
    49: {
        severity: 'error',
        reason:   "Subjects found in this dataset did not match the participant_ids found in the participants.tsv file."
    },
    50: {
        severity: 'error',
        reason: "You have to define 'TaskName' for this file."
    },
    51: {
        severity: 'error',
        reason: 'A phenotype/ .tsv file lists subjects that were not found in the dataset.'
    },
    52: {
        severity: 'error',
        reason: "A stimulus file was declared but not found in the dataset."
    }
};

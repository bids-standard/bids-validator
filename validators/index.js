// dependencies ------------------------------------------------------

var TSV    = require('./tsv');
var JSON   = require('./json');
var NIFTI  = require('./nii');
var BIDS   = require('./bids').start;
var bval   = require('./bval');
var bvec   = require('./bvec');

// public api --------------------------------------------------------

var validate = {
	BIDS: BIDS,
	JSON: JSON,
	TSV: TSV,
	NIFTI: NIFTI,
	bval: bval,
	bvec: bvec
};

// exports -----------------------------------------------------------

module.exports = validate;
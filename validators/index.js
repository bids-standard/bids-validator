// dependencies ------------------------------------------------------

var async  = require('async');
var utils  = require('../utils');

var TSV    = require('./tsv');
var JSON   = require('./json');
var NIFTI  = require('./nii');
var BIDS   = require('./bids');

// public api --------------------------------------------------------

var validate = {
	BIDS: BIDS,
	JSON: JSON,
	TSV: TSV,
	NIFTI: NIFTI
};

// exports -----------------------------------------------------------

module.exports = validate;
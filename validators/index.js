// dependencies ------------------------------------------------------

var tsv = require('./tsv')
var JSON = require('./json').json
var NIFTI = require('./nii')
var BIDS = require('./bids').start
var Events = require('./events')
var bval = require('./bval').bval
var bvec = require('./bvec').bvec
var utils = require('../utils')

// public api --------------------------------------------------------

var validate = {
  BIDS: BIDS,
  JSON: JSON,
  TSV: tsv,
  NIFTI: NIFTI,
  Events: Events,
  bval: bval,
  bvec: bvec,
  reformat: utils.issues.reformat,
  utils: utils,
}

// exports -----------------------------------------------------------

module.exports = validate

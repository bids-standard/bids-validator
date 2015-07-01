var async  = require('async');

/**
 * NIFTI
 *
 * Takes a NifTi file header and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI (header, callback) {
    var errors = [];

    callback(errors);
};
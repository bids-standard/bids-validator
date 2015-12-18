var Issue = require('../utils').Issue;

/**
 * bvec
 *
 * Takes a bvec file, its contents as a string
 * and a callback as arguments. Callsback
 * with any issues it finds while validating
 * against the BIDS specification.
 */
module.exports = function bvec (file, contents, callback) {

    var issues = [];

    if (contents.replace(/^\s+|\s+$/g, '').split('\n').length !== 3) {
        issues.push(new Issue({
            code: 31,
            file: file
        }));
    }

    callback(issues);
};
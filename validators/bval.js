var Issue = require('../utils').Issue;

/**
 * bval
 *
 * Takes a bval file, its contents as a string
 * and a callback as arguments. Callsback
 * with any issues it finds while validating
 * against the BIDS specification.
 */
module.exports = function TSV (file, contents, callback) {

    var issues = [];

    if (contents.replace(/^\s+|\s+$/g, '').split('\n').length !== 1) {
        issues.push(new Issue({
            code: 30,
            file: file
        }));
    }

    callback(issues);
};
var JSHINT = require('jshint').JSHINT;

/**
 * JSON
 *
 * Takes a JSON file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function JSON (contents, callback) {
    if (!JSHINT(contents)) {
        var out = JSHINT.data(),
        errors = out.errors;
        callback(errors);
    } else {
        callback(null);
    }
};
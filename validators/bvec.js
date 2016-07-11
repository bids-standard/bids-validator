var Issue = require('../utils').Issue;
var type  = require('../utils').type;

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

    var rows = contents.replace(/^\s+|\s+$/g, '').split('\n');
    var inconsistentRows, rowLength, invalidValue = false;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i].replace(/^\s+|\s+$/g, '').split(' ');
        if (!rowLength) {rowLength = row.length;}

        // check for consistent row length
        if (rowLength !== row.length) {inconsistentRows = true;}

        // check for proper separator and value type
        for (var j = 0; j < row.length; j++) {
            var value = row[j];
            if (!type.isNumber(value)) {
                invalidValue = true;
            }
        }
    }
    if (inconsistentRows) {
        issues.push(new Issue({
            code: 46,
            file: file
        }));
    }
    if (invalidValue) {
        issues.push(new Issue({
            code: 47,
            file: file
        }));
    }

    callback(issues);
};
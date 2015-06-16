var async  = require('async');

/**
 * TSV
 *
 * Takes a TSV file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function TSV (contents, callback) {
    var rows = contents.split('\n');
    var errors = [];
    var headers = rows[0].split('\t');

    // check if headers begin with numbers
    for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        var firstChar = header[0];
        if (!isNaN(parseInt(firstChar))) {
            var newError = {
                evidence: header,
                line: 1,
                character: rows[0].indexOf(firstChar),
                reason: 'Headers may not begin with a number'
            }
            errors.push(newError);
        }
    }

    // iterate through rows
    async.each(rows, function (row, cb) {
        var columnsInRow = row.split('\t');

        // check for different length rows
        if (columnsInRow.length !== headers.length) {
            var newError = {
                evidence: row,
                line: rows.indexOf(row) + 1,
                character: null,
                reason: 'All rows must have the same number of columns as there are headers.'
            }
            errors.push(newError);
        }

        // iterated through colums
        async.each(columnsInRow, function (column, cb1) {
	        
            // check for two or more contiguous spaces
            var patt = new RegExp("[ ]{2,}");
	        if (patt.test(column)) {
                var newError = {
                    evidence: row,
                    line: rows.indexOf(row) + 1,
                    character: row.indexOf('  '),
                    reason: 'Values may not contain adjacent spaces.'
                }
                errors.push(newError);
	        }

	        cb1();
        }, function () {cb();});
    }, function () {
        callback(errors);
    });
};
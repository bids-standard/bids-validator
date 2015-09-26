var async  = require('async');

/**
 * TSV
 *
 * Takes a TSV file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function TSV (contents, isEvents, callback) {

    var rows = contents.split('\n');
    var errors = [];
    var warnings = [];
    var headers = rows[0].split('\t');

    // check if headers begin with numbers
    if (isEvents) {
        if (headers[0] !== "onset"){
            var newError = {
                evidence: headers,
                line: 1,
                character: rows[0].indexOf(headers[0]),
                reason: "First column of the events file must be named 'onset'"
            }

            errors.push(newError);
        }
        if (headers[1] !== "duration"){
            var newError = {
                evidence: headers,
                line: 1,
                character: rows[0].indexOf(headers[1]),
                reason: "Second column of the events file must be named 'duration'"
            }

            errors.push(newError);
        }
    }

    // iterate through rows
    async.each(rows, function (row, cb) {

        //skip empty rows
        if (!row || /^\s*$/.test(row)){
            cb();
            return
        }
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

            // check if missing value is properly labeled as 'n/a'
            if (column === "NA" || column === "na" || column === "nan") {
                var newError = {
                    evidence: row,
                    line: rows.indexOf(row) + 1,
                    character: row.indexOf('NA' || 'na' || 'nan'),
                    reason: 'A proper way of labeling missing values is "n/a".'
                }

                warnings.push(newError);
            }

	        cb1();
        }, function () {cb();});
    }, function () {
        callback(errors, warnings);
    });
};
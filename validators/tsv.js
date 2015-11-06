var async = require('async');
var Issue = require('../utils').Issue;

/**
 * TSV
 *
 * Takes a TSV file as a string and a callback
 * as arguments. And callsback with any issues
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function TSV (file, contents, isEvents, callback) {

    var rows = contents.split('\n');
    var issues = [];
    var headers = rows[0].split('\t');

    // check if headers begin with numbers
    if (isEvents) {
        if (headers[0] !== "onset"){
            issues.push(new Issue({
                file: file,
                evidence: headers,
                line: 1,
                character: rows[0].indexOf(headers[0]),
                code: 20
            }));
        }
        if (headers[1] !== "duration"){
            issues.push(new Issue({
                file: file,
                evidence: headers,
                line: 1,
                character: rows[0].indexOf(headers[1]),
                code: 21
            }));
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
            issues.push(new Issue({
                file: file,
                evidence: row,
                line: rows.indexOf(row) + 1,
                code: 22
            }));
        }

        // iterate through columns
        async.each(columnsInRow, function (column, cb1) {

            // check for two or more contiguous spaces
            var patt = new RegExp("[ ]{2,}");
	        if (patt.test(column)) {
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: rows.indexOf(row) + 1,
                    character: row.indexOf('  '),
                    code: 23
                }));
	        }

            // check if missing value is properly labeled as 'n/a'
            if (column === "NA" || column === "na" || column === "nan") {
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: rows.indexOf(row) + 1,
                    character: row.indexOf('NA' || 'na' || 'nan'),
                    code: 23
                }));
            }

	        cb1();
        }, function () {cb();});
    }, function () {
        callback(issues);
    });
};
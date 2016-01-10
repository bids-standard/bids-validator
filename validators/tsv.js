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
        column_num = 1
        async.each(columnsInRow, function (column, cb1) {

            // check if missing value is properly labeled as 'n/a'
            if (column === "") {
                // empty cell should raise an error
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: rows.indexOf(row) + 1,
                    character: "at column # "+column_num,
                    code: 23
                }));
            } else if (column === "NA" || column === "na" || column === "nan") {
                // these cases should raise warning
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: rows.indexOf(row) + 1,
                    character: "at column # "+column_num,
                    code: 24
                }));
            }
            column_num++
	        cb1();
        }, function () {cb();});
    }, function () {
        callback(issues);
    });
};
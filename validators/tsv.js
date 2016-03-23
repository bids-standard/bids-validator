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

    var emptyCells = 0;
    // iterate rows
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        // skip empty rows
        if (!row || /^\s*$/.test(row)) {continue;}

        var columns = row.split('\t');

        // check for different length rows
        if (columns.length !== headers.length) {
            issues.push(new Issue({
                file: file,
                evidence: row,
                line: i + 1,
                code: 22
            }));
        }

        // iterate columns
        for (var j = 0; j < columns.length; j++) {
            var column = columns[j];

            if (column === "" && emptyCells < 5) {
                emptyCells++;
                // empty cell should raise an error
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: i + 1,
                    character: "at column # " + (j+1),
                    code: 23
                }));
            } else if (column === "NA" || column === "na" || column === "nan") {
                // check if missing value is properly labeled as 'n/a'
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: i + 1,
                    character: "at column # " + (j+1),
                    code: 24
                }));
            }
        }
    }

    callback(issues);
};
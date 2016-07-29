var Issue = require('../utils').Issue;

/**
 * TSV
 *
 * Takes a TSV file as a string and a callback
 * as arguments. And callsback with any issues
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function TSV (file, contents, callback) {

    var issues = [];
    var rows = contents.split('\n');
    var headers = rows[0].split('\t');

// generic checks -----------------------------------------------------------

    var columnMismatch = false;
    var emptyCells     = false;
    var NACells        = false;
    // iterate rows
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (columnMismatch && emptyCells && NACells) {break;}

        // skip empty rows
        if (!row || /^\s*$/.test(row)) {continue;}

        var values = row.split('\t');

        // check for different length rows
        if (values.length !== headers.length && !columnMismatch) {
            columnMismatch = true;
            issues.push(new Issue({
                file: file,
                evidence: row,
                line: i + 1,
                code: 22
            }));
        }

        // iterate values
        for (var j = 0; j < values.length; j++) {
            var value = values[j];
            if (columnMismatch && emptyCells && NACells) {break;}

            if (value === "" && !emptyCells) {
                emptyCells = true;
                // empty cell should raise an error
                issues.push(new Issue({
                    file: file,
                    evidence: row,
                    line: i + 1,
                    character: "at column # " + (j+1),
                    code: 23
                }));
            } else if ((value === "NA" || value === "na" || value === "nan") && !NACells) {
                NACells = true;
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

// specific file checks -----------------------------------------------------

    // events.tsv
    if (file.name.endsWith('_events.tsv')) {
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

    // participants.tsv
    var participants = null;
    if (file.name === 'participants.tsv') {
        var participantIdColumn = headers.indexOf('participant_id');
        if (participantIdColumn === -1) {
            issues.push(new Issue({
                file: file,
                evidence: headers.join('\t'),
                line: 1,
                code: 48
            }));
        } else {
            participants = [];
            for (var i = 1; i < rows.length; i++) {
                var row = rows[i].split('\t');
                // skip empty rows
                if (!row || /^\s*$/.test(row)) {continue;}
                participants.push(row[participantIdColumn].replace('sub-', ''));
            }
        }

    }

    callback(issues, participants);
};
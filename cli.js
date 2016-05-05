/*eslint no-console: ["error", {allow: ["log"]}] */

var validate  = require('./index.js');
var colors    = require('colors/safe');
var cliff     = require('cliff');
var pluralize = require('pluralize');
var bytes     = require('bytes');
var fs        = require('fs');

module.exports = function (dir, options) {
    options.filesPerIssueMax = 10;
    if (fs.existsSync(dir)) {
        validate.BIDS(dir, options, function (errors, warnings, summary) {
            if (errors === 'Invalid') {
                console.log(colors.red("This does not appear to be a BIDS dataset. For more info go to http://bids.neuroimaging.io/"));
            } else if (errors.length >= 1 || warnings.length >= 1) {
                logIssues(errors, 'red', options);
                logIssues(warnings, 'yellow', options);
            }
            else {
                console.log(colors.green("This dataset appears to be BIDS compatible."));
            }
            logSummary(summary);
        });
    } else {
        console.log(colors.red(dir + " does not exist"));
    }
};

function logIssues (issues, color, options) {
    for (var i = 0; i < issues.length; i++) {
        var issue = issues[i];
        console.log('\t' + colors[color]((i + 1) + ': ' + issue.reason + ' (code: ' + issue.code + ')'));
        for (var j = 0; j < issue.files.length; j++) {
            var file = issues[i].files[j];
            if (!file) {continue;}
            console.log('\t\t' + file.file.relativePath);
            if (options.verbose) {console.log('\t\t\t' + file.reason);}
            if (file.line) {
                var msg = '\t\t\t@ line: ' + file.line;
                if (file.character) {
                    msg += ' character: ' + file.character;
                }
                console.log(msg);
            }
            if (file.evidence) {
                console.log('\t\t\tEvidence: ' + file.evidence);
            }

            if (!options.verbose && (j+1) >= options.filesPerIssueMax) {
                var remaining = issue.files.length - (j+1);
                console.log('\t\t'+colors[color]('... and '+remaining+' more files having this issue (Use --verbose to see them all).'));
                break;
            }

        }
        console.log();
    }
}

function logSummary (summary) {

    var numSessions = summary.sessions.length > 0 ? summary.sessions.length : 1;

    // data
    var column1 = [
            summary.totalFiles      + ' '   + pluralize('File', summary.totalFiles) + ', ' + bytes(summary.size),
            summary.subjects.length + ' - ' + pluralize('Subject', summary.subjects.length),
            numSessions             + ' - ' + pluralize('Session', numSessions)
        ],
        column2 = summary.tasks,
        column3 = summary.modalities;

    var longestColumn = Math.max(column1.length, column2.length, column3.length);
    var pad = '       ';

    // headers
    var headers = [pad, colors.blue.underline('Summary:') + pad, colors.blue.underline('Available Tasks:') + pad, colors.blue.underline('Available Modalities:')]

    // rows
    var rows = [headers];
    for (var i = 0; i < longestColumn; i++) {
        var val1, val2, val3;
        val1 = column1[i] ? column1[i] + pad : '';
        val2 = column2[i] ? column2[i] + pad : '';
        val3 = column3[i] ? column3[i] : '';
        rows.push(['       ', val1, val2, val3]);
    }
    console.log(cliff.stringifyRows(rows));

    console.log();
}
var validate = require('./index.js');
var colors = require('colors/safe');
var fs = require('fs')

module.exports = function (dir, options) {
	options.filesPerIssueMax = 10;
	if (fs.existsSync(dir)) {
	    validate.BIDS(dir, options, function (errors, warnings) {
	    	if (errors === 'Invalid') {
	    		console.log(colors.red("This does not appear to be a BIDS dataset. For more info go to http://bids.neuroimaging.io/"));
	    	} else if (errors.length >= 1 || warnings.length >= 1) {
		        logIssues(errors, 'red', options);
				logIssues(warnings, 'yellow', options);
			}
			else {
				console.log(colors.green("This dataset appears to be BIDS compatible."));
			}
	    });
	} else {
		console.log(colors.red(dir + " does not exits"))
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
				var msg = '\t\t\t@ line: ' + file.line
				if (file.character) {
					msg += ' character: ' + file.character
				}
				console.log(msg)
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

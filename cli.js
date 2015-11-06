var validate = require('./index.js');
var colors = require('colors/safe');
var fs = require('fs')

module.exports = function (dir, options) {
	if (fs.existsSync(dir)) {
	    validate.BIDS(dir, options, function (errors, warnings) {
	    	console.log(errors);
	    	console.log(warnings);
	    	console.log(errors.length);
	    	console.log(warnings.length);
	  //   	if (errors === 'Invalid') {
	  //   		console.log(colors.red("This does not appear to be a BIDS dataset. For more info go to http://bids.neuroimaging.io/"));
	  //   	} else if (errors.length >= 1 || warnings.length >= 1) {
		 //        logIssues(errors, 'red');
			// 	logIssues(warnings, 'yellow');
			// }
			// else {
			// 	console.log(colors.green("This dataset appears to be BIDS compatible."));
			// }
	    });
	} else {
		console.log(colors.red(dir + " does not exits"))
	}
};

function logIssues (issues, color) {
	for (var i = 0; i < issues.length; i++) {
    	console.log('\t' + colors[color](issues[i].path));
    	for (var j = 0; j < issues[i].errors.length; j++) {
    		var error = issues[i].errors[j];
    		if (!error) {continue;}
    		console.log('\t' + error.reason);
			if (error.line) {
				var msg = '\t@ line: ' + error.line
				if (error.character) {
					msg += ' character: ' + error.character
				}
				console.log(msg)
			}
			if (error.evidence) {
				console.log('\tEvidence: ' + error.evidence);
			}
    		console.log('\tSeverity: ' + error.severity);
    		console.log();
    	}
    }
}

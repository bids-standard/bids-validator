var utils = require('./utils');
var fs    = require('fs');

var parsed;
utils.files.readNiftiHeader({path: process.argv[2]}, function (results) {
	parsed = JSON.stringify(results);
	// parsed = parsed.substr(0, 500);
	fs.writeFile('nifti-parsed', parsed, function (err) {
		console.log('complete');
	});
});
var validate = require('../index');
var fs       = require('fs');
var args     = process.argv;
var dir      = args[2];

validate.BIDSPath(dir, function (errors) {
	for (var i = 0; i < errors.length; i++) {
		console.log(errors[i]);
	}
});


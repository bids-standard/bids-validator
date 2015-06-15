var validate = require('./index.js');

module.exports = function () {
	var args = process.argv;
	var dir  = args[2];

	if (dir) {
	    validate.BIDSPath(dir, function (errors) {
	        for (var i = 0; i < errors.length; i++) {
	            console.log(errors[i]);
	        }
	    });
	}
};
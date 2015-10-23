var assert   = require('assert');
var validate = require('../index');

describe('NIFTI', function(){

	var path = '';
	var header = {error: 'Unable to read ' + path};
	var jsonContentsDict = {};

	it('should catch NIfTI file reading errors', function(){
		validate.NIFTI(header, path, jsonContentsDict, function (errors, warnings) {
			assert(errors && errors.length > 0);
		});
	});


});
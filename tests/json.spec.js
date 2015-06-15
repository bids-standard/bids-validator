var assert   = require('assert');
var validate = require('../index');

describe('JSON', function(){
	it('should catch missing closing brackets', function(){
		validate.JSON('{', function (errors) {
			assert(errors && errors.length > 0);
		});
	});
});
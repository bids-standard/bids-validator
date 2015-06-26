var assert   = require('assert');
var validate = require('../index');

describe('JSON', function(){
	
	it('should catch missing closing brackets', function(){
		validate.JSON('{', function (errors) {
			assert(errors && errors.length > 0);
		});
	});

	it('should have key/value pair for "repetition_time"', function(){
		var jsonObj = '{"repetition_time": 0.5, "echo_time": 0.005, "flip_angle": 90}';
		validate.JSON(jsonObj, function (errors) {
			assert(errors == null);
		});
		var jsonObjInval = '{"echo_time": 0.005, "flip_angle": 90}';
		validate.JSON(jsonObjInval, function (errors) {
			assert(errors && errors.length === 1);
		});
		var jsonObjSpell = '{"repitition_time": 0.5, "echo_time": 0.005, "flip_angle": 90}';
		validate.JSON(jsonObjSpell, function (errors) {
			assert(errors && errors.length === 1);
		});
	});

});

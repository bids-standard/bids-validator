var assert   = require('assert');
var validate = require('../index');

describe('JSON', function(){
	
	it('should catch missing closing brackets', function(){
		validate.JSON('{', false, function (errors) {
			assert(errors && errors.length > 0);
		});
	});

	it('sidecars should have key/value pair for "RepetitionTime"', function(){
		var jsonObj = '{"RepetitionTime": 0.5, "echo_time": 0.005, "flip_angle": 90}';
		validate.JSON(jsonObj, true, function (errors) {
			assert(errors.length === 0);
		});
		var jsonObjInval = '{"echo_time": 0.005, "flip_angle": 90}';
		validate.JSON(jsonObjInval, true, function (errors) {
			assert(errors && errors.length === 1);
		});
		var jsonObjSpell = '{"RepititionTime": 0.5, "echo_time": 0.005, "flip_angle": 90}';
		validate.JSON(jsonObjSpell, true, function (errors) {
			assert(errors && errors.length === 1);
		});
	});

});

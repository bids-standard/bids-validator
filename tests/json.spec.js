var assert   = require('assert');
var validate = require('../index');

describe('JSON', function(){

	var file = {
		name: 'task-rest_bold.json',
		relativePath: '/task-rest_bold.json'
	};

	it('should catch missing closing brackets', function(){
		validate.JSON(file, '{', function (issues) {
			assert(issues && issues.length > 0);
		});
	});

	it('sidecars should have key/value pair for "RepetitionTime" expressed in seconds', function(){
		var jsonObj = '{"RepetitionTime": 1.2, "echo_time": 0.005, "flip_angle": 90, "TaskName": "Rest"}';
		validate.JSON(file, jsonObj, function (issues) {
			assert(issues.length === 0);
		});
		var jsonObjInval = '{"RepetitionTime": 1200, "echo_time": 0.005, "flip_angle": 90, "TaskName": "Rest"}';
		validate.JSON(file, jsonObjInval, function (issues) {
			assert(issues && issues.length === 1);
		});
	});

	it('sidecar SliceTiming shouldnot be greator than RepetitionTime', function(){
		var jsonObjInval = '{"RepetitionTime": 1.2, "echo_time": 0.005, "flip_angle": 90, "TaskName": "Rest", "SliceTiming":[0.0, 1.7759, 0.0517, 0.8276, 0.1034, 1.8793, 0.1552]}';
		validate.JSON(file, jsonObjInval, function (issues) {
			console.log(issues.lenth);
			assert(issues.length === 1 && issues);
		});
	});


});

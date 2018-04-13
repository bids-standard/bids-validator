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

	it('should detect negative value for SliceTiming', function(){
		var jsonObj = '{"RepetitionTime": 1.2, "SliceTiming": [-1.0, 0.0, 1.0], "TaskName": "Rest"}';
		validate.JSON(file, jsonObj, function (issues) {
			assert(issues.length === 1 && issues[0].code == 55);
		});
	});

  var meg_file = {
      name: 'sub-01_run-01_meg.json',
      relativePath: '/sub-01_run-01_meg.json'
  };

  it('*_meg.json sidecars should have required key/value pairs', function(){
      var jsonObj = '{"TaskName": "Audiovis", "SamplingFrequency": 1000, ' +
                    ' "PowerLineFrequency": 50, "DewarPosition": "Upright", ' +
                    ' "SoftwareFilters": "n/a", "DigitizedLandmarks": true,' +
                    ' "DigitizedHeadPoints": false}';
      validate.JSON(meg_file, jsonObj, function (issues) {
          assert(issues.length === 0);
      });

      var jsonObjInval = jsonObj.replace(/"SamplingFrequency": 1000, /g, '');
      validate.JSON(meg_file, jsonObjInval, function(issues){
          assert(issues && issues.length === 1);
      });
  });

	var ieeg_file = {
      name: 'sub-01_run-01_ieeg.json',
      relativePath: '/sub-01_run-01_ieeg.json'
  };

  it('*_ieeg.json sidecars should have required key/value pairs', function(){
      var jsonObj = '{"TaskName": "Audiovis", "Manufacturer": "TDT", ' +
                    ' "PowerLineFrequency": 50}';
      validate.JSON(ieeg_file, jsonObj, function (issues) {
          assert(issues.length === 0);
      });

      var jsonObjInval = jsonObj.replace(/"Manufacturer": "TDT", /g, '');
      validate.JSON(ieeg_file, jsonObjInval, function(issues){
          assert(issues && issues.length === 1);
      });
  });
});

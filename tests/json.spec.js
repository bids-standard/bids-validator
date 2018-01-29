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
        var jsonObj = '{"TaskName": "Audiovis", "Manufacturer": "Elekta", "SamplingFrequency": 1000, ' +
                      '"MEGChannelCount": 306, "MEGREFChannelCount": 0, "EEGChannelCount": 32,' +
                      '"EOGChannelCount": 1, "ECGChannelCount": 0, "EMGChannelCount": 0,' +
                      '"MiscChannelCount": 4, "TriggerChannelCount": 4}';
        validate.JSON(meg_file, jsonObj, function (issues) {
            assert(issues.length === 0);
        });

        var jsonObjInval = jsonObj.replace(/"EOGChannelCount": 1, /g, '');
        validate.JSON(meg_file, jsonObjInval, function(issues){
            assert(issues && issues.length === 1);
        });
    });
});

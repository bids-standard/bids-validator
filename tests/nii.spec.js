var assert   = require('assert');
var validate = require('../index');

describe('NIFTI', function(){

	var file = {
		name: 'sub-15_task-mixedeventrelatedprobe_run-01_bold.nii.gz',
		relativePath: '/sub-15/func/sub-15_task-mixedeventrelatedprobe_run-01_bold.nii.gz'
	};
	var header = {error: 'Unable to read ' + file.relativePath};
	var jsonContentsDict = {
		'/sub-15/func/sub-15_task-mixedeventrelatedprobe_run-01_bold.json': {
			EchoTime: 1,
			PhaseEncodingDirection: 3,
			EffectiveEchoSpacing: 5,
			SliceTiming: 3,
			SliceEncodingDirection: 4
		}
	};
	var events = [
		'/sub-15/func/sub-14_task-mixedeventrelatedprobe_run-01_events.tsv',
		'/sub-15/run-01_events.tsv'
	];

	it('should catch NIfTI file reading errors', function(){
		validate.NIFTI(header, file, jsonContentsDict, events, function (errors, warnings) {
			assert(errors && errors.length > 0);
		});
	});

	it('should warn user about misisng events file', function() {
		validate.NIFTI(header, file, jsonContentsDict, events, function (errors, warnings) {
			assert(warnings.length = 1);
		});
	});

	it('should ignore missing events files for rest scans', function() {
		jsonContentsDict['/sub-15/func/sub-15_task-mixedeventrelatedproberest_run-01_bold.json'] = jsonContentsDict['/sub-15/func/sub-15_task-mixedeventrelatedprobe_run-01_bold.json'];
		file.relativePath = '/sub-15/func/sub-15_task-mixedeventrelatedproberest_run-01_bold.nii.gz';
		validate.NIFTI(header, file, jsonContentsDict, events, function (errors, warnings) {
			assert.deepEqual(warnings, []);
		});
	});


});
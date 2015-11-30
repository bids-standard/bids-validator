var assert   = require('assert');
var validate = require('../index');

describe('TSV', function(){

	var file = {
		name: 'sub-08_ses-test_task-linebisection_events.tsv',
		relativePath: '/sub-08/ses-test/func/sub-08_ses-test_task-linebisection_events.tsv'
	};


	it('should not allow different length rows', function () {
		var tsv = 'header-one\theader-two\theader-three\n' +
				  'value-one\tvalue-two\n' +
				  'value-one\tvalue-two\tvalue-three';
		validate.TSV(file, tsv, false, function (errors) {
			assert(errors && errors.length > 0);
		});
	});

	it('require events files to have "onset" and "duration" columns', function () {
		var tsv = 'header-one\theader-two\t4eader-three\n' +
				  'value-one\tvalue-two\tvalue-three';
		validate.TSV(file, tsv, true, function (errors) {
			assert(errors && errors.length > 0);
		});
	});

});
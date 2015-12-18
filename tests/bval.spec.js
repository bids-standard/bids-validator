var assert   = require('assert');
var validate = require('../index');

describe('bval', function(){

	var bval = '0 4 3 6 1 6 2 4 1\n 4 3 5 2 4 2 4 5';

	it('should not allow more or less than one row', function () {
		validate.bval({}, bval, function (issues) {
			assert(issues.length == 1 && issues[0].code == 30);
		});

		bval = '4 6 2 5 3 23 5';
		validate.bval({}, bval, function (issues) {
			assert.deepEqual(issues, []);
		});
	});

});
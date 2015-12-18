var assert   = require('assert');
var validate = require('../index');

describe('bvec', function(){

	var bval = '0 4 3 6 1 6 2 4 1\n 4 3 5 2 4 2 4 5';

	it('should not allow more or less than 3 rows', function () {
		validate.bvec({}, bval, function (issues) {
			assert(issues.length == 1 && issues[0].code == 31);
		});

		bval = '4 6 2 5\n 3 2 3 5\n 6 4 3 5';
		validate.bvec({}, bval, function (issues) {
			assert.deepEqual(issues, []);
		});
	});

});
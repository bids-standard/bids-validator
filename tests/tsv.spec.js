/**
 *  Copyright 2015 Zachary Michael - Squishmedia
 *
 *  This file is part of BIDS-Validator.
 *
 *  BIDS-Validator is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  BIDS-Validator is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with BIDS-Validator.  If not, see <http://www.gnu.org/licenses/>
 **/

var assert   = require('assert');
var validate = require('../index');

describe('TSV', function(){

	it('should not allow contiguous spaces', function () {
		var tsv = 'value-one\tvalue-two  value-three';
		validate.TSV(tsv, function (errors) {
			assert(errors && errors.length > 0);
		});
	});

	it('should not allow different length rows', function () {
		var tsv = 'header-one\theader-two\theader-three\n' +
				  'value-one\tvalue-two\n' +
				  'value-one\tvalue-two\tvalue-three';
		validate.TSV(tsv, function (errors) {
			assert(errors && errors.length > 0);
		});
	});

	it('should not allow headers to begin with numbers', function () {
		var tsv = 'header-one\theader-two\t4eader-three\n' +
				  'value-one\tvalue-two\tvalue-three';
		validate.TSV(tsv, function (errors) {
			assert(errors && errors.length > 0);
		});
	});

});
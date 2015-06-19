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

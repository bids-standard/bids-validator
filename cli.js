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

var validate = require('./index.js');
var colors = require('colors/safe');

module.exports = function () {
	var args = process.argv;
	var dir  = args[2];

	if (dir) {
	    validate.BIDS(dir, function (issues) {
	        console.log();
	        for (var i = 0; i < issues.length; i++) {
	        	console.log('\t' + colors.red(issues[i].file.name));
	        	for (var j = 0; j < issues[i].errors.length; j++) {
	        		var error = issues[i].errors[j];
	        		if (!error) {continue;}
	        		console.log('\t' + error.reason);
	        		console.log('\t@ line: ' + error.line + ' character: ' + error.character);
	        		console.log('\t' + error.evidence);
	        		console.log('\t' + error.severity);
	        		console.log();
	        	}
	        }
	    });
	}
};
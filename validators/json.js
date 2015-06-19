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

var JSHINT = require('jshint').JSHINT;

/**
 * JSON
 *
 * Takes a JSON file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */




module.exports = function (contents, callback) {

    if (!JSHINT(contents)) {
        var out = JSHINT.data(),
        errors = out.errors;
        callback(errors);
    } else {
    	// TODO figure out how to filter sidecar only files
    	var jsObj = JSON.parse(contents);
    	jsObj = jsObj.hasOwnProperty('repetition_time');
		if(jsObj === false){
			errors = []
			var newError = {
                evidence: contents,
                line: null,
                character: null,
                reason: 'JSON sidecar files must have key and value for repetition_time'
            }
            errors.push(newError);
            callback(errors);
		}else{
	        callback(null);
	    }

    }
};
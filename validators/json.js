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
        for(var i = 0; errors.length > i; ++i){
        	if(errors[i]){
	        	errors[i].severity = 'error';
	        }
	    }
        callback(errors);
    } else {
    	// TODO figure out how to filter sidecar only files
    	var jsObj = JSON.parse(contents);
    	jsObj = jsObj.hasOwnProperty('RepetitionTime');
		if(jsObj === false){
			errors = []
			var newError = {
                evidence: contents,
                line: null,
                character: null,
                reason: 'JSON sidecar files must have key and value for repetition_time',
                severity: 'error'
            }
            errors.push(newError);
            callback(errors);
		}else{
	        callback(null);
	    }

    }
};
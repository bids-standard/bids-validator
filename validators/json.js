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

// primary flow --------------------------------------------------------------------

    var errors = [];
    var jsObj  = null;

    try {
        jsObj = JSON.parse(contents);
    }
    catch (err) {
        jshint(contents);
    }
    finally {

        // TODO figure out how to filter sidecar only files
        if (jsObj) {
            repetitionTime(jsObj);
        }

        errors = errors.length > 0 ? errors : null;
        callback(errors);
    }

// individual checks ---------------------------------------------------------------

    /**
     * JSHint
     *
     * Checks known invalid JSON file
     * content in order to produce a
     * verbose error message.
     */
    function jshint (contents) {
        if (!JSHINT(contents)) {
            var out = JSHINT.data();
            errors  = out.errors;
            for(var i = 0; errors.length > i; ++i){
                if(errors[i]){
                    errors[i].severity = 'error';
                }
            }
        }
    }

    /**
     * Repetition Time
     *
     * Checks if a sidecar/metadata file
     * contains a RepetitionTime property.
     */
     // TODO - determine which files are sidecars
     // TODO - check which level RepetitionTime should appear at
    function repetitionTime (sidecar) {
        if (!sidecar.hasOwnProperty('RepetitionTime')) {
            errors = []
            var newError = {
                evidence: null,
                line: null,
                character: null,
                reason: 'JSON sidecar files must have key and value for repetition_time',
                severity: 'error'
            }
            errors.push(newError);
        }
    }

};
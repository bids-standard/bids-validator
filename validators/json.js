var JSHINT = require('jshint').JSHINT;


/**
 * JSON
 *
 * Takes a JSON file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function (contents, isBOLDSidecar, callback) {

// primary flow --------------------------------------------------------------------

    var errors = [];
    var jsObj  = null;

    try {
        jsObj = JSON.parse(contents);
    }
    catch (err) {
        jshint(contents);
    }

    if (jsObj) {
        if (isBOLDSidecar) {
            repetitionTime(jsObj);
        }
    }
    callback(errors);

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
                reason: 'JSON sidecar files must have key and value for RepetitionTime'
            }
            errors.push(newError);
        }
    }

};
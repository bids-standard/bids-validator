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
    var warnings = [];
    var jsObj  = null;

    try {
        jsObj = JSON.parse(contents);
    }
    catch (err) {
        jshint(contents);
    }

    if (jsObj) {
        checkUnits(jsObj);
    }
    callback(errors, warnings, jsObj);

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

    function checkUnits (sidecar) {
        if (sidecar.hasOwnProperty('RepetitionTime') && sidecar["RepetitionTime"] > 100) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "'RepetitionTime' is greater than 100 are you sure it's expressed in seconds?"
            }
            warnings.push(newError);
        }

        if (sidecar.hasOwnProperty('EchoTime') && sidecar["EchoTime"] > 1) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "'EchoTime' is greater than 1 are you sure it's expressed in seconds?"
            }
            warnings.push(newError);
        }
        if (sidecar.hasOwnProperty('EchoTimeDifference') && sidecar["EchoTimeDifference"] > 1) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "'EchoTimeDifference' is greater than 1 are you sure it's expressed in seconds?"
            }
            warnings.push(newError);
        }
        if (sidecar.hasOwnProperty('TotalReadoutTime') && sidecar["TotalReadoutTime"] > 10) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "'TotalReadoutTime' is greater than 10 are you sure it's expressed in seconds?"
            }
            warnings.push(newError);
        }
    }

};
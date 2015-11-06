var JSHINT = require('jshint').JSHINT;
var Issue = require('../utils').Issue;


/**
 * JSON
 *
 * Takes a JSON file as a string and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function (file, contents, callback) {

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
            warnings.push(new Issue({
                file: file,
                severity: "warning",
                reason: "'RepetitionTime' is greater than 100 are you sure it's expressed in seconds?"
            }));
        }

        if (sidecar.hasOwnProperty('EchoTime') && sidecar["EchoTime"] > 1) {
            warnings.push(new Issue({
                file: file,
                severity: "warning",
                reason: "'EchoTime' is greater than 1 are you sure it's expressed in seconds?"
            }));
        }
        if (sidecar.hasOwnProperty('EchoTimeDifference') && sidecar["EchoTimeDifference"] > 1) {
            warnings.push(new Issue({
                file: file,
                severity: "warning",
                reason: "'EchoTimeDifference' is greater than 1 are you sure it's expressed in seconds?"
            }));
        }
        if (sidecar.hasOwnProperty('TotalReadoutTime') && sidecar["TotalReadoutTime"] > 10) {
            warnings.push(new Issue({
                file: file,
                severity: "warning",
                reason: "'TotalReadoutTime' is greater than 10 are you sure it's expressed in seconds?"
            }));
        }
    }

};
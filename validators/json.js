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

    var issues = [];
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
    callback(issues, jsObj);

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
            for(var i = 0; out.errors.length > i; ++i){
                var error = out.errors[i];
                if(error){
                    issues.push(new Issue({
                        code:      27,
                        file:      file,
                        line:      error.line      ? error.line      : null,
                        character: error.character ? error.character : null,
                        reason:    error.reason    ? error.reason    : null,
                        evidence:  error.evidence  ? error.evidence  : null
                    }));
                }
            }
        }
    }

    function checkUnits (sidecar) {
        if (sidecar.hasOwnProperty('RepetitionTime') && sidecar["RepetitionTime"] > 100) {
            issues.push(new Issue({
                file: file,
                code: 2
            }));
        }

        if (sidecar.hasOwnProperty('EchoTime') && sidecar["EchoTime"] > 1) {
            issues.push(new Issue({
                file: file,
                code: 3
            }));
        }
        if (sidecar.hasOwnProperty('EchoTime1') && sidecar["EchoTime1"] > 1) {
            issues.push(new Issue({
                file: file,
                code: 4
            }));
        }
        if (sidecar.hasOwnProperty('EchoTime2') && sidecar["EchoTime2"] > 1) {
            issues.push(new Issue({
                file: file,
                code: 4
            }));
        }
        if (sidecar.hasOwnProperty('TotalReadoutTime') && sidecar["TotalReadoutTime"] > 10) {
            issues.push(new Issue({
                file: file,
                code: 5
            }));
        }
    }

};
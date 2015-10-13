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
    var warnings = [];
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
    callback(errors, warnings);

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

            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "error",
                reason: 'JSON sidecar files must have key and value for RepetitionTime'
            }
            errors.push(newError);
        }
        if (!sidecar.hasOwnProperty('SliceTiming')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: 'JSON sidecar files should have key and value for SliceTiming'
            }
            warnings.push(newError);
        }
        if (!sidecar.hasOwnProperty('PhaseEncodingDirection')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: 'JSON sidecar files should have key and value for PhaseEncodingDirection'
            }
            warnings.push(newError);
        }
        if (!sidecar.hasOwnProperty('EchoTime')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: 'JSON sidecar files should have key and value for EchoTime'
            }
            warnings.push(newError);
        }
        if (!sidecar.hasOwnProperty('SliceEncodingDirection')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: 'JSON sidecar files should have key and value for SliceEncodingDirection'
            }
            warnings.push(newError);
        }
        if (!sidecar.hasOwnProperty('EffectiveEchoSpacing')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: 'JSON sidecar files should have key and value for EffectiveEchoSpacing'
            }
            warnings.push(newError);
        }
    }

};
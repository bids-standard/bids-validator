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
        console.log("error")
        var newError = {
            evidence: null,
            line: err.lineNumber,
            character: null,
            severity: 'error',
            reason: err.message
        }
        errors.push(newError);
    }
    if (jsObj) {
        if (isBOLDSidecar) {
            repetitionTime(jsObj);
        }
    }

    callback(errors);


// individual checks ---------------------------------------------------------------


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
                reason: 'JSON sidecar files must have key and value for RepetitionTime'
            }
            errors.push(newError);
        }
    }

};
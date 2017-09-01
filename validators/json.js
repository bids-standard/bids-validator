var utils = require('../utils');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var Issue = utils.issues.Issue;

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

    utils.json.parse(file, contents, function (pissues, jsObj) {
        issues = pissues;
        if (jsObj) {issues = issues.concat(checkUnits(file, jsObj));}
        callback(issues, jsObj);
    });

};

// individual checks ---------------------------------------------------------------

function checkUnits (file, sidecar) {
    var issues = [];
    var schema = null;
    if (file.name) {
        if (file.name.endsWith("participants.json")) {
            schema = require('./schemas/data_dictionary.json');
        } else if (file.name.endsWith("bold.json") || file.name.endsWith("sbref.json")) {
            schema = require('./schemas/bold.json');
        } else if (file.relativePath === "/dataset_description.json") {
            schema = require('./schemas/dataset_description.json');
        } else if (file.name.endsWith("meg.json")) {
            schema = require('./schemas/meg.json');
        } else if (file.name.endsWith("fid.json")) {
            schema = require('./schemas/fid.json');
        }
        if (schema) {
            var validate = ajv.compile(schema);
            var valid = validate(sidecar);
            if (!valid) {
                for (var i = 0; i < validate.errors.length; i++) {
                    issues.push(new Issue({
                        file: file,
                        code: 55,
                        evidence: validate.errors[i].dataPath + ' ' + validate.errors[i].message
                    }));
                }
            }
        }
    }


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
    if (sidecar.hasOwnProperty('PhaseEncodingDirection') && ["i", "i-", "j", "j-", "k", "k-"].indexOf(sidecar["PhaseEncodingDirection"]) == -1) {
        issues.push(new Issue({
            file: file,
            code: 34
        }));
    }
    if (sidecar.hasOwnProperty('SliceEncodingDirection') && ["i", "i-", "j", "j-", "k", "k-"].indexOf(sidecar["SliceEncodingDirection"]) == -1) {
        issues.push(new Issue({
            file: file,
            code: 35
        }));
    }
    return issues;
}

var async  = require('async');
var utils  = require('../utils');

/**
 * NIFTI
 *
 * Takes a NifTi file header and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI (funcBOLDpath, jsonContentsDict, callback) {
    var errors = [];
    var warnings = [];
    var sidecarJSON = funcBOLDpath.replace(".nii.gz", ".json");
    var pathComponents = sidecarJSON.split('/');
    var filenameComponents = pathComponents[pathComponents.length - 1].split("_");
    var sessionLevelComponentList = [];
    var subjectLevelComponentList = [];
    var topLevelComponentList = [];
    var ses = null;
    var sub = null;



    filenameComponents.forEach(function (filenameComponent) {
        if (filenameComponent.substring(0, 3) != "run") {
            sessionLevelComponentList.push(filenameComponent);
            if (filenameComponent.substring(0, 3) == "ses") {
                ses = filenameComponent;

            } else {
                subjectLevelComponentList.push(filenameComponent);
                if (filenameComponent.substring(0, 3) == "sub") {
                    sub = filenameComponent;
                } else {
                    topLevelComponentList.push(filenameComponent);
                }
            }
        }
    });

    var potentialJSONs = [sidecarJSON];

    if (ses) {
        var sessionLevelJSON = "/" + sub + "/" + ses + "/" + sessionLevelComponentList.join("_");
        potentialJSONs.push(sessionLevelJSON)
    };

    var subjectLevelJSON = "/" + sub + "/" + subjectLevelComponentList.join("_");
    potentialJSONs.push(subjectLevelJSON);

    var topLevelJSON = "/" + topLevelComponentList.join("_");
    potentialJSONs.push(topLevelJSON);


    var mergedDictionary = {};
    async.forEachOf(potentialJSONs, function (file, key, cb) {
        var jsObj = jsonContentsDict[file];
        if (jsObj) {
            for (var attrname in jsObj) {
                mergedDictionary[attrname] = jsObj[attrname];
            }
        }
        return cb();
    }, function(){
        var locMSg = "It can be included one of the following locations: " + potentialJSONs.join(", ")
        if (!mergedDictionary.hasOwnProperty('RepetitionTime')) {

            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "error",
                reason: "You have to define 'RepetitionTime' for this file." + locMSg
            }
            errors.push(newError);
        } else if (mergedDictionary["RepetitionTime"] > 100) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "'RepetitionTime' field does not seem to be expressed in seconds."
            }
            warnings.push(newError);
        }
        if (!mergedDictionary.hasOwnProperty('SliceTiming')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "You should should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible." + locMSg
            }
            warnings.push(newError);
        }
        if (!mergedDictionary.hasOwnProperty('SliceEncodingDirection')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "You should should define 'SliceEncodingDirection' for this file. If you don't provide this information slice time correction will not be possible." + locMSg
            }
            warnings.push(newError);
        }
        if (!mergedDictionary.hasOwnProperty('EchoTime')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "You should should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible." + locMSg
            }
            warnings.push(newError);
        } else if (mergedDictionary["EchoTime"] > 1) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "'EchoTime' field does not seem to be expressed in seconds."
            }
            warnings.push(newError);
        }
        if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "You should should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible." + locMSg
            }
            warnings.push(newError);
        }
        if (!mergedDictionary.hasOwnProperty('EffectiveEchoSpacing')) {
            var newError = {
                evidence: null,
                line: null,
                character: null,
                severity: "warning",
                reason: "You should should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible." + locMSg
            }
            warnings.push(newError);
        }
        callback(errors, warnings);
    });


};
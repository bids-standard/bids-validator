var async  = require('async');

/**
 * NIFTI
 *
 * Takes a NifTi file header and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI (path, jsonContentsDict, callback) {
    var errors = [];
    var warnings = [];
    var sidecarJSON = path.replace(".nii.gz", ".json");
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
        var locMSg = "It can be included one of the following locations: " + potentialJSONs.join(", ");
        if (path.endsWith("_bold.nii.gz") || path.endsWith("_sbref.nii.gz") || path.endsWith("_dwi.nii.gz")) {
            if (!mergedDictionary.hasOwnProperty('EchoTime')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "warning",
                    reason: "You should should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible. " + locMSg
                }
                warnings.push(newError);
            }
            if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "warning",
                    reason: "You should should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible. " + locMSg
                }
                warnings.push(newError);
            }
            if (!mergedDictionary.hasOwnProperty('EffectiveEchoSpacing')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "warning",
                    reason: "You should should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible. " + locMSg
                }
                warnings.push(newError);
            }
        }
        if (path.endsWith("_dwi.nii.gz")) {
            if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "warning",
                    reason: "You should should define 'TotalReadoutTime' for this file. If you don't provide this information field map correction using TOPUP might not be possible. " + locMSg
                }
                warnings.push(newError);
            }
        }
        // we don't need slice timing or repetitin time for SBref
        if (path.endsWith("_bold.nii.gz")) {
            if (!mergedDictionary.hasOwnProperty('RepetitionTime')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "error",
                    reason: "You have to define 'RepetitionTime' for this file. " + locMSg
                }
                errors.push(newError);
            }
            if (!mergedDictionary.hasOwnProperty('SliceTiming')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "warning",
                    reason: "You should should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible. " + locMSg
                }
                warnings.push(newError);
            }
            if (!mergedDictionary.hasOwnProperty('SliceEncodingDirection')) {
                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "warning",
                    reason: "You should should define 'SliceEncodingDirection' for this file. If you don't provide this information slice time correction will not be possible. " + locMSg
                }
                warnings.push(newError);
            }
        }
        else if (path.endsWith("_phasediff.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('EchoTimeDifference')) {

                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "error",
                    reason: "You have to define 'EchoTimeDifference' for this file. " + locMSg
                }
                errors.push(newError);
            }
        } else if (path.endsWith("_phase1.nii.gz") || path.endsWith("_phase2.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('EchoTime')) {

                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "error",
                    reason: "You have to define 'EchoTime' for this file. " + locMSg
                }
                errors.push(newError);
            }
        } else if (path.endsWith("_fieldmap.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('Units')) {

                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "error",
                    reason: "You have to define 'Units' for this file. " + locMSg
                }
                errors.push(newError);
            }
        } else if (path.endsWith("_epi.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {

                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "error",
                    reason: "You have to define 'PhaseEncodingDirection' for this file. " + locMSg
                }
                errors.push(newError);
            }
            if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {

                var newError = {
                    evidence: null,
                    line: null,
                    character: null,
                    severity: "error",
                    reason: "You have to define 'TotalReadoutTime' for this file. " + locMSg
                }
                errors.push(newError);
            }
        }
        callback(errors, warnings);
    });


};
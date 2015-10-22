var async = require('async');
var utils = require('../utils');
var Issue = utils.Issue;

/**
 * NIFTI
 *
 * Takes a NifTi file path and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI (file, jsonContentsDict, callback) {
    var path = utils.files.relativePath(file);
    var errors = [];
    var warnings = [];
    var potentialSidecars = determinePotentialSidecars(path);
    var mergedDictionary = generateMergedSidecarDict(potentialSidecars, jsonContentsDict);
    var locationMessage = "It can be included one of the following locations: " + potentialSidecars.join(", ");

    utils.files.readNiftiHeader(file, function (header) {

        // check if header could be read
        if (header.hasOwnProperty('error')) {
            errors.push(new Issue({
                reason: "We were unable to read the contents of this file."
            }));
        } else {
            // Define repetition time from header and coerce to seconds.
            var repetitionTime = header.pixdim[4];
            var repetitionUnit = header.xyzt_units[3];
            if (repetitionUnit === 'ms') {repetitionTime = repetitionTime / 1000;    repetitionUnit = 's'}
            if (repetitionUnit === 'us') {repetitionTime = repetitionTime / 1000000; repetitionUnit = 's'}
        }

        if (path.endsWith("_bold.nii.gz") || path.endsWith("_sbref.nii.gz") || path.endsWith("_dwi.nii.gz")) {
            if (!mergedDictionary.hasOwnProperty('EchoTime')) {
                warnings.push(new Issue({
                    severity: "warning",
                    reason: "You should should define 'EchoTime' for this file. If you don't provide this information field map correction will not be possible. " + locationMessage
                }));
            }
            if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
                warnings.push(new Issue({
                    severity: "warning",
                    reason: "You should should define 'PhaseEncodingDirection' for this file. If you don't provide this information field map correction will not be possible. " + locationMessage
                }));
            }
            if (!mergedDictionary.hasOwnProperty('EffectiveEchoSpacing')) {
                warnings.push(new Issue({
                    severity: "warning",
                    reason: "You should should define 'EffectiveEchoSpacing' for this file. If you don't provide this information field map correction will not be possible. " + locationMessage
                }));
            }
        }
        if (path.endsWith("_dwi.nii.gz")) {
            if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
                warnings.push(new Issue({
                    severity: "warning",
                    reason: "You should should define 'TotalReadoutTime' for this file. If you don't provide this information field map correction using TOPUP might not be possible. " + locationMessage
                }));
            }
        }
        // we don't need slice timing or repetition time for SBref
        if (path.endsWith("_bold.nii.gz")) {
            if (!mergedDictionary.hasOwnProperty('RepetitionTime')) {
                errors.push(new Issue({
                    reason: "You have to define 'RepetitionTime' for this file. " + locationMessage
                }));
            }

            if (repetitionTime) {
                if (repetitionUnit !== 's') {
                    warnings.push(new Issue({
                        severity: "warning",
                        reason: "Repetition time was not defined in either seconds, milliseconds or microseconds in the scan's header. " + locationMessage
                    }));
                } else if (repetitionTime !== mergedDictionary.RepetitionTime) {
                    warnings.push(new Issue({
                        severity: "Warning",
                        reason: "Repetition time did not match between the scan's header and the associated JSON metadata file. " + locationMessage
                    }));
                }
            }

            if (!mergedDictionary.hasOwnProperty('SliceTiming')) {
                warnings.push(new Issue({
                    severity: "warning",
                    reason: "You should should define 'SliceTiming' for this file. If you don't provide this information slice time correction will not be possible. " + locationMessage
                }));
            }
            if (!mergedDictionary.hasOwnProperty('SliceEncodingDirection')) {
                warnings.push(new Issue({
                    severity: "warning",
                    reason: "You should should define 'SliceEncodingDirection' for this file. If you don't provide this information slice time correction will not be possible. " + locationMessage
                }));
            }
        }
        else if (path.endsWith("_phasediff.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('EchoTimeDifference')) {
                errors.push(new Issue({
                    reason: "You have to define 'EchoTimeDifference' for this file. " + locationMessage
                }));
            }
        } else if (path.endsWith("_phase1.nii.gz") || path.endsWith("_phase2.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('EchoTime')) {
                errors.push(new Issue({
                    reason: "You have to define 'EchoTime' for this file. " + locationMessage
                }));
            }
        } else if (path.endsWith("_fieldmap.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('Units')) {
                errors.push(new Issue({
                    reason: "You have to define 'Units' for this file. " + locationMessage
                }));
            }
        } else if (path.endsWith("_epi.nii.gz")){
            if (!mergedDictionary.hasOwnProperty('PhaseEncodingDirection')) {
                errors.push(new Issue({
                    reason: "You have to define 'PhaseEncodingDirection' for this file. " + locationMessage
                }));
            }
            if (!mergedDictionary.hasOwnProperty('TotalReadoutTime')) {
                errors.push(new Issue({
                    reason: "You have to define 'TotalReadoutTime' for this file. " + locationMessage
                }));
            }
        }
        callback(errors, warnings);
    });
};


/**
 * Determine Potential Sidecars
 *
 * Takes a NIFTI scan path and returns a list
 * of all potential JSON sidecar paths.
 */
function determinePotentialSidecars(scanPath) {
    var sidecarJSON = scanPath.replace(".nii.gz", ".json");
    var pathComponents = sidecarJSON.split('/');
    var filenameComponents = pathComponents[pathComponents.length - 1].split("_");

    var sessionLevelComponentList = [],
        subjectLevelComponentList = [],
        topLevelComponentList = [],
        ses = null,
        sub = null;

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

    return potentialJSONs;
}

/**
 * Generate Merged Sidecar Dictionary
 *
 * Takes an array of potential sidecards and a
 * master object dictionary of all JSON file
 * content and returns a merged dictionary
 * containing all values from the potential
 * sidecars.
 */
function generateMergedSidecarDict(potentialSidecars, jsonContents) {
    var mergedDictionary = {};
    for (var i = 0; i < potentialSidecars.length; i++) {
        var sidecarName = potentialSidecars[i];
        var jsonObject = jsonContents[sidecarName];
        if (jsonObject) {
            for (var key in jsonObject) {
                mergedDictionary[key] = jsonObject[key];
            }
        }
    }
    return mergedDictionary;
}
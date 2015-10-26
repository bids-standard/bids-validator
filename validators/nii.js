var async = require('async');
var utils = require('../utils');
var Issue = utils.Issue;

/**
 * NIFTI
 *
 * Takes a NifTi header, a file path and a callback
 * as arguments. And callsback with any errors
 * it finds while validating against the BIDS
 * specification.
 */
module.exports = function NIFTI (header, path, jsonContentsDict, events, callback) {
    var errors = [];
    var warnings = [];
    var potentialSidecars = potentialLocations(path.replace(".nii.gz", ".json"));
    var potentialEvents   = potentialLocations(path.replace("bold.nii.gz", "events.tsv"));
    var mergedDictionary  = generateMergedSidecarDict(potentialSidecars, jsonContentsDict);
    var locationMessage   = "It can be included one of the following locations: " + potentialSidecars.join(", ");

    var missingEvents = false;
    for (var event of potentialEvents) {
        if (path.toLowerCase().indexOf('rest') || events.indexOf(event) == -1) {
            missingEvents = true;
        }
    }
    if (missingEvents) {
        // console.log(path);
    }

    // check if header could be read
    if (header && header.hasOwnProperty('error')) {
        errors.push(new Issue({
            reason: "We were unable to read the contents of this file."
        }));
    } else if (header) {
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
                errors.push(new Issue({
                    reason: "Repetition time was not defined in seconds, milliseconds or microseconds in the scan's header."
                }));
            } else if (repetitionTime !== mergedDictionary.RepetitionTime) {
                errors.push(new Issue({
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
};


/**
 * Potential Locations
 *
 * Takes the path to the lowest possible level of
 * a file that can be hierarchily positioned and
 * return a list of all possible locations for that
 * file.
 */
function potentialLocations(path) {
    var potentialPaths = [path];
    var pathComponents = path.split('/');
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

    if (ses) {
        var sessionLevelPath= "/" + sub + "/" + ses + "/" + sessionLevelComponentList.join("_");
        potentialPaths.push(sessionLevelPath)
    };

    var subjectLevelPath = "/" + sub + "/" + subjectLevelComponentList.join("_");
    potentialPaths.push(subjectLevelPath);

    var topLevelPath = "/" + topLevelComponentList.join("_");
    potentialPaths.push(topLevelPath);

    return potentialPaths;
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